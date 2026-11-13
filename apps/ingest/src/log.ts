import type { ScraperEventEmitter } from "@sneu/scraper/events";

/** Pipes scraper events to stdout as one JSON object per line. */
export function attachLogger(emitter: ScraperEventEmitter): void {
  const line = (msg: string, data?: Record<string, unknown>) =>
    console.log(JSON.stringify({ msg, ...data }));

  emitter.on("scrape:sections:start", ({ term }) =>
    line("sweep started", { term }),
  );
  emitter.on("scrape:sections:done", ({ count }) =>
    line("sweep done", { sections: count }),
  );
  emitter.on("scrape:detail:start", () => line("detail started"));
  emitter.on("scrape:detail:done", () => line("detail done"));
  emitter.on("warn", ({ message, data }) => line(message, data));
  emitter.on("error", ({ message, data }) =>
    console.error(JSON.stringify({ msg: message, ...data })),
  );
  emitter.on("fetch:error", ({ crn, step, message }) =>
    line("banner request failed", { crn, step, error: message }),
  );
}
