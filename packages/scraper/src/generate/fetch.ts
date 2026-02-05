interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryOn?: number[] | ((response: Response) => boolean);
  onRetry?: (error: Error | Response, attempt: number) => void;
  timeout?: number;
  jitter?: boolean;
}

export async function $fetch(
  url: string | URL,
  options?: RequestInit,
  retryOptions?: RetryOptions,
): Promise<Response> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryOn = [408, 429, 500, 502, 503, 504],
    onRetry,
    timeout = 60000,
    jitter = true,
  } = retryOptions || {};

  let lastError: Error | Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const shouldRetry =
        typeof retryOn === "function"
          ? retryOn(response)
          : retryOn.includes(response.status);

      if (!response.ok && shouldRetry && attempt < maxRetries) {
        lastError = response;
        if (onRetry) onRetry(response, attempt + 1);
        await delay(
          calculateDelay(
            attempt,
            initialDelay,
            maxDelay,
            backoffMultiplier,
            jitter,
          ),
        );
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      if (
        error instanceof Error &&
        error.name === "AbortError" &&
        !options?.signal?.aborted
      ) {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      if (attempt < maxRetries) {
        if (onRetry) onRetry(error as Error, attempt + 1);
        await delay(
          calculateDelay(
            attempt,
            initialDelay,
            maxDelay,
            backoffMultiplier,
            jitter,
          ),
        );
      } else {
        throw error;
      }
    }
  }

  if (lastError instanceof Response) {
    throw new Error(`HTTP ${lastError.status}: ${lastError.statusText}`);
  }
  throw lastError;
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number,
  addJitter: boolean,
): number {
  const exponentialDelay = Math.min(
    initialDelay * Math.pow(multiplier, attempt),
    maxDelay,
  );

  if (addJitter) {
    const jitter = exponentialDelay * 0.25 * Math.random();
    return exponentialDelay + jitter;
  }

  return exponentialDelay;
}

/**
 * Simple delay promise
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// fetch engine
interface FetchEngineConfig {
  maxRetries?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
  retryBackoffMultiplier?: number;
  throttleDelay?: number;
  maxConcurrent?: number;
  retryOn?: (response: Response, error?: Error) => boolean;
}

interface FetchRequestOptions extends RequestInit {
  onRetry?: (attempt: number, delay: number, error?: Error) => void;
  onSuccess?: (response: Response) => void;
  onError?: (error: Error) => void;
  onQueueAdd?: () => void;
  onQueueStart?: () => void;
  maxRetries?: number;
}

interface QueuedRequest {
  id: string;
  url: string;
  options: FetchRequestOptions;
  resolve: (value: Response) => void;
  reject: (reason: Error) => void;
  attempts: number;
}

export class FetchEngine {
  private config: Required<FetchEngineConfig>;
  private queue: QueuedRequest[] = [];
  private activeRequests = 0;
  private processing = false;
  private requestIdCounter = 0;

  constructor(config: FetchEngineConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      initialRetryDelay: config.initialRetryDelay ?? 1000,
      maxRetryDelay: config.maxRetryDelay ?? 30000,
      retryBackoffMultiplier: config.retryBackoffMultiplier ?? 2,
      throttleDelay: config.throttleDelay ?? 100,
      maxConcurrent: config.maxConcurrent ?? 5,
      retryOn:
        config.retryOn ??
        ((response, error) => {
          if (error) return true;
          return response.status === 429 || response.status >= 500;
        }),
    };
  }

  /**
   * Main fetch method that adds requests to the queue
   */
  async fetch(
    url: string,
    options: FetchRequestOptions = {},
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: `req_${++this.requestIdCounter}`,
        url,
        options,
        resolve,
        reject,
        attempts: 0,
      };

      this.queue.push(request);
      options.onQueueAdd?.();

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the queue with concurrency control
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 || this.activeRequests > 0) {
      // Wait if we've hit max concurrent requests
      while (
        this.activeRequests >= this.config.maxConcurrent &&
        this.queue.length > 0
      ) {
        await this.sleep(50);
      }

      const request = this.queue.shift();
      if (!request) {
        if (this.activeRequests === 0) break;
        await this.sleep(50);
        continue;
      }

      // Process request without blocking the queue
      this.executeRequest(request);

      // Throttle between requests
      if (this.queue.length > 0) {
        await this.sleep(this.config.throttleDelay);
      }
    }

    this.processing = false;
  }

  /**
   * Execute a single request with retry logic
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    this.activeRequests++;
    request.options.onQueueStart?.();

    const maxRetries = request.options.maxRetries ?? this.config.maxRetries;

    try {
      const response = await this.fetchWithRetry(request, maxRetries);
      request.options.onSuccess?.(response);
      request.resolve(response);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      request.options.onError?.(err);
      request.reject(err);
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Fetch with automatic retry logic
   */
  private async fetchWithRetry(
    request: QueuedRequest,
    maxRetries: number,
  ): Promise<Response> {
    let lastError: Error | undefined;

    while (request.attempts <= maxRetries) {
      try {
        const response = await fetch(request.url, request.options);

        // Check if we should retry based on response
        if (
          request.attempts < maxRetries &&
          this.config.retryOn(response.clone(), undefined)
        ) {
          request.attempts++;
          const delay = this.calculateRetryDelay(request.attempts);
          request.options.onRetry?.(request.attempts, delay);
          await this.sleep(delay);
          continue;
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry based on error
        if (request.attempts < maxRetries) {
          request.attempts++;
          const delay = this.calculateRetryDelay(request.attempts);
          request.options.onRetry?.(request.attempts, delay, lastError);
          await this.sleep(delay);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const delay = Math.min(
      this.config.initialRetryDelay *
        Math.pow(this.config.retryBackoffMultiplier, attempt - 1),
      this.config.maxRetryDelay,
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      processing: this.processing,
    };
  }

  /**
   * Clear the queue (does not affect active requests)
   */
  clearQueue(): void {
    const clearedRequests = this.queue.splice(0);
    clearedRequests.forEach((req) => {
      req.reject(new Error("Request cancelled: queue cleared"));
    });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FetchEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
