import { logger } from "@/lib/logger";

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

export async function processWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrencyLimit: number,
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const promise = task().then((result) => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrencyLimit) {
      await Promise.race(executing);
      executing.splice(0, executing.findIndex((p) => p === promise) + 1);
    }
  }

  await Promise.all(executing);
  return results;
}
