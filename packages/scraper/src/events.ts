/**
 * Event system for the scraper package.
 *
 * All scraper operations emit events instead of logging directly.
 * Consumers (CLI apps, services, etc.) subscribe to these events
 * and handle them however they want (console output, structured logging, etc.)
 */

export type ScraperEventMap = {
  // lifecycle
  "scrape:start": { term: string };
  "scrape:sections:start": { term: string };
  "scrape:sections:progress": { batch: number; totalBatches: number };
  "scrape:sections:done": { count: number };
  "scrape:subjects:start": undefined;
  "scrape:subjects:done": { count: number };
  "scrape:campuses:start": undefined;
  "scrape:campuses:done": { count: number };
  "scrape:term-definition:start": undefined;
  "scrape:term-definition:done": { code: string; description: string };
  "scrape:courses:stubbed": { count: number };
  "scrape:stats": {
    totalCourses: number;
    totalSections: number;
    ordinaryCourses: number;
    ordinarySections: number;
    specialTopicsCourses: number;
    specialTopicsSections: number;
    totalRequests: number;
    estimatedMinutes: number;
  };
  "scrape:detail:start": undefined;
  "scrape:detail:progress": {
    remaining: number;
    total: number;
    percent: number;
    active: number;
  };
  "scrape:detail:done": undefined;
  "scrape:done": { term: string };

  // config lifecycle
  "config:start": undefined;
  "config:load-caches": { count: number };
  "config:merge:campuses": { added: number; total: number };
  "config:merge:buildings": { added: number; total: number };
  "config:merge:subjects": { added: number; total: number };
  "config:merge:terms": { added: number; total: number };
  "config:done": undefined;

  // upload lifecycle
  "upload:start": { term: string };
  "upload:progress": { step: string };
  "upload:sections-to-remove": { count: number };
  "upload:meeting-times-to-remove": { count: number };
  "upload:done": { term: string; part: string };

  // warnings & errors
  warn: { message: string; data?: Record<string, unknown> };
  error: { message: string; data?: Record<string, unknown> };

  // debug / trace
  debug: { message: string; data?: Record<string, unknown> };
  trace: { message: string; data?: Record<string, unknown> };

  // fetch engine events
  "fetch:retry": {
    url?: string;
    crn?: string;
    step?: string;
    attempt: number;
    delay?: number;
  };
  "fetch:error": { crn?: string; step?: string; message: string };
};

type EventHandler<T> = T extends undefined ? () => void : (data: T) => void;

export class ScraperEventEmitter {
  private handlers = new Map<string, Set<(...args: unknown[]) => void>>();

  on<K extends keyof ScraperEventMap>(
    event: K,
    handler: EventHandler<ScraperEventMap[K]>,
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    const set = this.handlers.get(event)!;
    set.add(handler as (...args: unknown[]) => void);

    return () => {
      set.delete(handler as (...args: unknown[]) => void);
    };
  }

  emit<K extends keyof ScraperEventMap>(
    ...args: ScraperEventMap[K] extends undefined
      ? [event: K]
      : [event: K, data: ScraperEventMap[K]]
  ): void {
    const [event, data] = args;
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of set) {
      handler(data);
    }
  }
}
