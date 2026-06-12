import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ScraperEventEmitter } from "./events.js";

describe("ScraperEventEmitter", () => {
  test("on() + emit() delivers typed data payload", () => {
    const emitter = new ScraperEventEmitter();
    let received: { term: string } | undefined;

    emitter.on("scrape:start", (data) => {
      received = data;
    });
    emitter.emit("scrape:start", { term: "202510" });

    assert.deepStrictEqual(received, { term: "202510" });
  });

  test("emit() with undefined-payload event fires handler", () => {
    const emitter = new ScraperEventEmitter();
    let called = false;

    emitter.on("scrape:detail:start", () => {
      called = true;
    });
    emitter.emit("scrape:detail:start");

    assert.equal(called, true);
  });

  test("on() returns unsubscribe function that removes the handler", () => {
    const emitter = new ScraperEventEmitter();
    let callCount = 0;

    const unsub = emitter.on("scrape:start", () => {
      callCount++;
    });
    emitter.emit("scrape:start", { term: "202510" });
    assert.equal(callCount, 1);

    unsub();
    emitter.emit("scrape:start", { term: "202510" });
    assert.equal(callCount, 1);
  });

  test("multiple handlers for the same event all fire", () => {
    const emitter = new ScraperEventEmitter();
    const calls: number[] = [];

    emitter.on("scrape:start", () => calls.push(1));
    emitter.on("scrape:start", () => calls.push(2));
    emitter.on("scrape:start", () => calls.push(3));

    emitter.emit("scrape:start", { term: "202510" });

    assert.deepStrictEqual(calls, [1, 2, 3]);
  });

  test("emit() with no registered handlers does not throw", () => {
    const emitter = new ScraperEventEmitter();

    assert.doesNotThrow(() => {
      emitter.emit("scrape:start", { term: "202510" });
    });
  });

  test("handler receives the correct data object", () => {
    const emitter = new ScraperEventEmitter();
    let received: { batch: number; totalBatches: number } | undefined;

    emitter.on("scrape:sections:progress", (data) => {
      received = data;
    });

    const payload = { batch: 3, totalBatches: 10 };
    emitter.emit("scrape:sections:progress", payload);

    assert.deepStrictEqual(received, { batch: 3, totalBatches: 10 });
  });
});
