import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";
import { $fetch, FetchEngine } from "./fetch.js";

function mockResponse(
  status: number,
  body = "",
  statusText = "",
): Response {
  return new Response(body, { status, statusText });
}

const originalFetch = globalThis.fetch;

// Simulates a fetch that never resolves, but rejects with AbortError when aborted
function neverResolvingFetch(_url: string | URL | Request, init?: RequestInit): Promise<Response> {
  return new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => {
      reject(new DOMException("The operation was aborted.", "AbortError"));
    });
  });
}

afterEach(() => {
  nock.cleanAll();
  globalThis.fetch = originalFetch;
});

describe("$fetch", () => {
  test("successful request returns response", async () => {
    globalThis.fetch = async () => mockResponse(200, "success");

    const res = await $fetch("http://example.com/ok");
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.equal(body, "success");
  });

  test("retries on 429 status code", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount <= 2) return mockResponse(429, "rate limited");
      return mockResponse(200, "ok");
    };

    const res = await $fetch(
      "http://example.com/rate-limit",
      {},
      { maxRetries: 3, initialDelay: 10, jitter: false },
    );
    assert.equal(res.status, 200);
    assert.equal(callCount, 3);
  });

  test("retries on 500, 502, 503, 504 status codes", async () => {
    for (const status of [500, 502, 503, 504]) {
      let callCount = 0;
      globalThis.fetch = async () => {
        callCount++;
        if (callCount === 1) return mockResponse(status, "error");
        return mockResponse(200, "recovered");
      };

      const res = await $fetch(
        "http://example.com/server-err",
        {},
        { maxRetries: 2, initialDelay: 10, jitter: false },
      );
      assert.equal(res.status, 200, `should retry on ${status}`);
      assert.equal(callCount, 2, `should have retried once for ${status}`);
    }
  });

  test("does NOT retry on 400, 401, 403, 404", async () => {
    for (const status of [400, 401, 403, 404]) {
      let callCount = 0;
      globalThis.fetch = async () => {
        callCount++;
        return mockResponse(status, "client error");
      };

      const res = await $fetch(
        "http://example.com/client-err",
        {},
        { maxRetries: 3, initialDelay: 10, jitter: false },
      );
      assert.equal(
        res.status,
        status,
        `should return ${status} without retrying`,
      );
      assert.equal(callCount, 1, `should not retry on ${status}`);
    }
  });

  test("custom retryOn function overrides default behavior", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount === 1) return mockResponse(403, "forbidden");
      return mockResponse(200, "ok");
    };

    const res = await $fetch(
      "http://example.com/custom-retry",
      {},
      {
        maxRetries: 2,
        initialDelay: 10,
        jitter: false,
        retryOn: (response: Response) => response.status === 403,
      },
    );
    assert.equal(res.status, 200);
    assert.equal(callCount, 2);
  });

  test("exponential backoff: delay doubles between retries", async () => {
    let callCount = 0;
    const callTimestamps: number[] = [];
    globalThis.fetch = async () => {
      callCount++;
      callTimestamps.push(Date.now());
      if (callCount <= 3) return mockResponse(500, "fail");
      return mockResponse(200, "ok");
    };

    const res = await $fetch(
      "http://example.com/backoff",
      {},
      {
        maxRetries: 3,
        initialDelay: 50,
        jitter: false,
      },
    );

    assert.equal(res.status, 200);
    assert.equal(callCount, 4);

    // Delays should be: 50ms (50*2^0), 100ms (50*2^1), 200ms (50*2^2)
    // Check that the gap between calls increases
    const gap1 = callTimestamps[1]! - callTimestamps[0]!;
    const gap2 = callTimestamps[2]! - callTimestamps[1]!;
    const gap3 = callTimestamps[3]! - callTimestamps[2]!;

    // Allow some tolerance for timing
    assert.ok(gap1 >= 40, `first gap ${gap1}ms should be >= 40ms (target 50ms)`);
    assert.ok(gap2 >= 80, `second gap ${gap2}ms should be >= 80ms (target 100ms)`);
    assert.ok(gap3 >= 160, `third gap ${gap3}ms should be >= 160ms (target 200ms)`);
    // Verify exponential growth: each gap should be roughly double the previous
    assert.ok(
      gap2 > gap1 * 1.5,
      `second gap (${gap2}ms) should be roughly double first gap (${gap1}ms)`,
    );
  });

  test("max retries exhaustion returns last response for retryable status", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      return mockResponse(500, "fail");
    };

    const res = await $fetch(
      "http://example.com/exhaust",
      {},
      { maxRetries: 1, initialDelay: 10, jitter: false },
    );
    assert.equal(res.status, 500);
    assert.equal(callCount, 2);
  });

  test("timeout via AbortController throws 'Request timeout after Xms'", async () => {
    globalThis.fetch = neverResolvingFetch;

    await assert.rejects(
      () =>
        $fetch(
          "http://example.com/timeout",
          {},
          { timeout: 50, maxRetries: 0 },
        ),
      (err: Error) => {
        assert.match(err.message, /Request timeout after 50ms/);
        return true;
      },
    );
  });

  test("respects user-provided abort signal", async () => {
    const userController = new AbortController();
    globalThis.fetch = neverResolvingFetch;

    // Abort user signal after 20ms
    setTimeout(() => userController.abort(), 20);

    await assert.rejects(
      () =>
        $fetch(
          "http://example.com/user-abort",
          { signal: userController.signal },
          { timeout: 5000, maxRetries: 0 },
        ),
      (err: Error) => {
        assert.equal(err.name, "AbortError");
        return true;
      },
    );
  });

  test("onRetry callback is called with (response, attempt)", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount === 1) return mockResponse(500, "fail", "Internal Server Error");
      return mockResponse(200, "ok");
    };

    const retryCalls: Array<{
      errorOrResponse: Error | Response;
      attempt: number;
    }> = [];

    const res = await $fetch(
      "http://example.com/on-retry",
      {},
      {
        maxRetries: 2,
        initialDelay: 10,
        jitter: false,
        onRetry: (errorOrResponse, attempt) => {
          retryCalls.push({ errorOrResponse, attempt });
        },
      },
    );

    assert.equal(res.status, 200);
    assert.equal(retryCalls.length, 1);
    assert.equal(retryCalls[0]!.attempt, 1);
    assert.ok(retryCalls[0]!.errorOrResponse instanceof Response);
    assert.equal(
      (retryCalls[0]!.errorOrResponse as Response).status,
      500,
    );
  });

  test("jitter: false gives exact exponential delays", async () => {
    let callCount = 0;
    const callTimestamps: number[] = [];
    globalThis.fetch = async () => {
      callCount++;
      callTimestamps.push(Date.now());
      if (callCount <= 2) return mockResponse(500, "fail");
      return mockResponse(200, "ok");
    };

    await $fetch(
      "http://example.com/no-jitter",
      {},
      {
        maxRetries: 3,
        initialDelay: 50,
        jitter: false,
      },
    );

    assert.equal(callCount, 3);
    // With jitter: false, delays are exactly:
    // Retry 1 delay: 50 * 2^0 = 50ms
    // Retry 2 delay: 50 * 2^1 = 100ms
    const gap1 = callTimestamps[1]! - callTimestamps[0]!;
    const gap2 = callTimestamps[2]! - callTimestamps[1]!;

    // With no jitter, the delays should be close to exact values
    assert.ok(
      gap1 >= 45 && gap1 < 80,
      `first delay ${gap1}ms should be ~50ms`,
    );
    assert.ok(
      gap2 >= 90 && gap2 < 150,
      `second delay ${gap2}ms should be ~100ms`,
    );
  });

  test("maxDelay caps the backoff", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount <= 3) return mockResponse(500, "fail");
      return mockResponse(200, "ok");
    };

    const start = Date.now();

    await $fetch(
      "http://example.com/max-delay",
      {},
      {
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 120,
        backoffMultiplier: 10,
        jitter: false,
      },
    );

    const elapsed = Date.now() - start;
    // Without maxDelay cap, delays would be 100, 1000, 10000 = 11100ms
    // With maxDelay=120, delays are capped: min(100*10^0, 120)=100, min(100*10^1, 120)=120, min(100*10^2, 120)=120 = 340ms total
    assert.ok(
      elapsed < 1000,
      `elapsed ${elapsed}ms should be under 1000ms due to maxDelay cap`,
    );
    assert.equal(callCount, 4);
  });

  test("network error retries and ultimately throws", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      throw new TypeError("fetch failed");
    };

    await assert.rejects(
      () =>
        $fetch(
          "http://example.com/network-error",
          {},
          { maxRetries: 2, initialDelay: 10, jitter: false },
        ),
      (err: Error) => {
        assert.equal(err.message, "fetch failed");
        return true;
      },
    );
    assert.equal(callCount, 3); // initial + 2 retries
  });

  test("onRetry called on network error retry", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount === 1) throw new TypeError("fetch failed");
      return mockResponse(200, "ok");
    };

    const retryCalls: Array<{
      errorOrResponse: Error | Response;
      attempt: number;
    }> = [];

    const res = await $fetch(
      "http://example.com/net-err-retry",
      {},
      {
        maxRetries: 2,
        initialDelay: 10,
        jitter: false,
        onRetry: (errorOrResponse, attempt) => {
          retryCalls.push({ errorOrResponse, attempt });
        },
      },
    );

    assert.equal(res.status, 200);
    assert.equal(retryCalls.length, 1);
    assert.equal(retryCalls[0]!.attempt, 1);
    assert.ok(retryCalls[0]!.errorOrResponse instanceof Error);
    assert.equal(
      (retryCalls[0]!.errorOrResponse as Error).message,
      "fetch failed",
    );
  });
});

describe("FetchEngine", () => {
  test("basic fetch returns response", async () => {
    globalThis.fetch = async () => mockResponse(200, "engine success");

    const engine = new FetchEngine({
      throttleDelay: 1,
      maxConcurrent: 5,
    });

    const res = await engine.fetch("http://example.com/engine-ok");
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.equal(body, "engine success");
  });

  test("concurrency limiting: with maxConcurrent=1, requests are serialized", async () => {
    const order: number[] = [];
    let activeConcurrent = 0;
    let maxObservedConcurrent = 0;

    globalThis.fetch = async (url: string | URL | Request) => {
      activeConcurrent++;
      maxObservedConcurrent = Math.max(
        maxObservedConcurrent,
        activeConcurrent,
      );
      await new Promise((r) => setTimeout(r, 20));
      const urlStr = typeof url === "string" ? url : url.toString();
      if (urlStr.includes("serial-1")) order.push(1);
      if (urlStr.includes("serial-2")) order.push(2);
      activeConcurrent--;
      return mockResponse(200, "ok");
    };

    const engine = new FetchEngine({
      maxConcurrent: 1,
      throttleDelay: 1,
    });

    const [r1, r2] = await Promise.all([
      engine.fetch("http://example.com/serial-1"),
      engine.fetch("http://example.com/serial-2"),
    ]);

    assert.equal(r1.status, 200);
    assert.equal(r2.status, 200);
    assert.deepEqual(order, [1, 2]);
    assert.equal(
      maxObservedConcurrent,
      1,
      "should never have more than 1 concurrent request",
    );
  });

  test("queue processing: multiple requests are processed", async () => {
    let totalCalls = 0;
    globalThis.fetch = async () => {
      totalCalls++;
      return mockResponse(200, "ok");
    };

    const engine = new FetchEngine({
      maxConcurrent: 3,
      throttleDelay: 1,
    });

    const promises = Array.from({ length: 5 }, (_, i) =>
      engine.fetch(`http://example.com/multi-${i}`),
    );
    const responses = await Promise.all(promises);

    assert.equal(responses.length, 5);
    assert.equal(totalCalls, 5);
    for (const res of responses) {
      assert.equal(res.status, 200);
    }
  });

  test("retry with backoff on server errors", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount === 1) return mockResponse(500, "fail");
      return mockResponse(200, "recovered");
    };

    const engine = new FetchEngine({
      maxRetries: 2,
      initialRetryDelay: 10,
      maxRetryDelay: 100,
      throttleDelay: 1,
    });

    const res = await engine.fetch("http://example.com/engine-retry");
    assert.equal(res.status, 200);
    assert.equal(callCount, 2);
  });

  test("clearQueue rejects all pending requests with 'Request cancelled: queue cleared'", async () => {
    let fetchCallCount = 0;
    globalThis.fetch = async () => {
      fetchCallCount++;
      // First request takes a while
      if (fetchCallCount === 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
      return mockResponse(200, "ok");
    };

    const engine = new FetchEngine({
      maxConcurrent: 1,
      throttleDelay: 1,
    });

    // Start the active request
    const activePromise = engine
      .fetch("http://example.com/clear-active")
      .catch(() => null);

    // Queue pending requests
    const pendingPromises = Array.from({ length: 3 }, (_, i) =>
      engine
        .fetch(`http://example.com/clear-pending-${i}`)
        .catch((err: Error) => err),
    );

    // Give time for first request to be picked up and become active
    await new Promise((resolve) => setTimeout(resolve, 30));

    // Clear the queue
    engine.clearQueue();

    // Pending requests should be rejected
    const results = await Promise.all(pendingPromises);
    for (const result of results) {
      assert.ok(result instanceof Error);
      assert.equal(result.message, "Request cancelled: queue cleared");
    }

    // Wait for active to finish
    await activePromise;
  });

  test("getStatus reports queueLength, activeRequests, processing", async () => {
    let resolveRequest: (() => void) | null = null;
    globalThis.fetch = async () => {
      await new Promise<void>((r) => {
        resolveRequest = r;
      });
      return mockResponse(200, "ok");
    };

    const engine = new FetchEngine({
      maxConcurrent: 1,
      throttleDelay: 1,
    });

    // Before any requests
    const initialStatus = engine.getStatus();
    assert.equal(initialStatus.queueLength, 0);
    assert.equal(initialStatus.activeRequests, 0);
    assert.equal(initialStatus.processing, false);

    // Start a request
    const promise = engine.fetch("http://example.com/status-check");

    // Give time for processing to start and request to become active
    await new Promise((resolve) => setTimeout(resolve, 20));

    const activeStatus = engine.getStatus();
    assert.equal(activeStatus.processing, true);
    assert.equal(activeStatus.activeRequests, 1);

    // Resolve the pending fetch
    resolveRequest!();
    await promise;
  });

  test("per-request maxRetries override", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount <= 2) return mockResponse(500, "fail");
      return mockResponse(200, "ok");
    };

    const engine = new FetchEngine({
      maxRetries: 1,
      initialRetryDelay: 10,
      maxRetryDelay: 50,
      throttleDelay: 1,
    });

    const res = await engine.fetch("http://example.com/per-req-retry", {
      maxRetries: 3,
    });
    assert.equal(res.status, 200);
    assert.equal(callCount, 3);
  });

  test("callbacks: onQueueAdd, onQueueStart, onSuccess are called", async () => {
    globalThis.fetch = async () => mockResponse(200, "ok");

    const engine = new FetchEngine({
      throttleDelay: 1,
    });

    const calls: string[] = [];

    const res = await engine.fetch("http://example.com/callbacks", {
      onQueueAdd: () => calls.push("queueAdd"),
      onQueueStart: () => calls.push("queueStart"),
      onSuccess: () => calls.push("success"),
    });

    assert.equal(res.status, 200);
    assert.ok(calls.includes("queueAdd"), "onQueueAdd should be called");
    assert.ok(
      calls.includes("queueStart"),
      "onQueueStart should be called",
    );
    assert.ok(calls.includes("success"), "onSuccess should be called");
    // Verify order
    assert.ok(
      calls.indexOf("queueAdd") < calls.indexOf("queueStart"),
      "queueAdd before queueStart",
    );
    assert.ok(
      calls.indexOf("queueStart") < calls.indexOf("success"),
      "queueStart before success",
    );
  });

  test("callback: onRetry is called on server error retry", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount === 1) return mockResponse(500, "fail");
      return mockResponse(200, "ok");
    };

    const engine = new FetchEngine({
      maxRetries: 2,
      initialRetryDelay: 10,
      maxRetryDelay: 50,
      throttleDelay: 1,
    });

    const retryCalls: Array<{ attempt: number; delay: number }> = [];

    await engine.fetch("http://example.com/cb-retry", {
      onRetry: (attempt, delay) => {
        retryCalls.push({ attempt, delay });
      },
    });

    assert.equal(retryCalls.length, 1);
    assert.equal(retryCalls[0]!.attempt, 1);
    assert.ok(retryCalls[0]!.delay > 0);
  });

  test("callback: onError is called on failure", async () => {
    globalThis.fetch = async () => {
      throw new TypeError("fetch failed");
    };

    const engine = new FetchEngine({
      maxRetries: 1,
      initialRetryDelay: 10,
      maxRetryDelay: 50,
      throttleDelay: 1,
    });

    const errors: Error[] = [];

    try {
      await engine.fetch("http://example.com/cb-error", {
        maxRetries: 1,
        onError: (err) => errors.push(err),
      });
    } catch {
      // expected to throw
    }

    assert.equal(errors.length, 1);
    assert.ok(errors[0] instanceof Error);
  });

  test("updateConfig changes runtime configuration", async () => {
    globalThis.fetch = async () => mockResponse(200, "ok");

    const engine = new FetchEngine({
      maxConcurrent: 5,
      throttleDelay: 100,
    });

    engine.updateConfig({ maxConcurrent: 10, throttleDelay: 50 });

    const res = await engine.fetch("http://example.com/updated-config");
    assert.equal(res.status, 200);

    // Allow the processQueue loop to finish its final iteration
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify updateConfig works by checking status still reports correctly
    const status = engine.getStatus();
    assert.equal(status.processing, false);
  });
});
