/** The only path to Banner. */

import * as z from "zod";
import type { ScraperEventEmitter } from "../events";
import { BannerSectionResponse } from "../schemas/banner/section";
import { BannerCampusesResponse } from "../schemas/banner/campuses";
import { BannerTermsResponse } from "../schemas/banner/terms";
import { BannerSubjectsResponse } from "../schemas/banner/subjects";
import { BannerSectionMeetingsFacultyResponse } from "../schemas/banner/meetingsFaculty";
import { BANNER } from "./config";

export class BannerError extends Error {
  readonly url: string;
  readonly status: number | undefined;
  readonly attempts: number;

  constructor(
    message: string,
    info: { url: string; status?: number; attempts: number; cause?: unknown },
  ) {
    super(message, { cause: info.cause });
    this.name = "BannerError";
    this.url = info.url;
    this.status = info.status;
    this.attempts = info.attempts;
  }
}

/** Banner answers an expired session with a 200 and an HTML login page. */
class StaleSessionError extends Error {
  constructor() {
    super("banner session expired");
    this.name = "StaleSessionError";
  }
}

export interface BannerClientOptions {
  baseUrl?: string;
  maxConcurrent?: number;
  minDelayMs?: number;
  maxRetries?: number;
  initialRetryDelayMs?: number;
  maxRetryDelayMs?: number;
  timeoutMs?: number;
  sessionPool?: number;
  /** aborts in-flight and queued requests */
  signal?: AbortSignal;
  emitter?: ScraperEventEmitter;
}

export interface BannerClientStats {
  requests: number;
  retries: number;
  failures: number;
  inFlight: number;
  queued: number;
  sessionsCreated: number;
}

class Gate {
  private active = 0;
  private readonly waiting: (() => void)[] = [];
  private lastStart = 0;

  constructor(
    private readonly limit: number,
    private readonly minDelayMs: number,
  ) {}

  get inFlight(): number {
    return this.active;
  }

  get queued(): number {
    return this.waiting.length;
  }

  /** Resolves to a release function once there is room to send. */
  async enter(signal?: AbortSignal): Promise<() => void> {
    if (this.active >= this.limit) {
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    }
    this.active++;

    if (this.minDelayMs > 0) {
      const wait = this.lastStart + this.minDelayMs - Date.now();
      if (wait > 0) await sleep(wait, signal);
      this.lastStart = Date.now();
    }

    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.active--;
      this.waiting.shift()?.();
    };
  }
}

/**
 * One session per in-flight search. Banner binds the searched term to the
 * cookie, so two concurrent pages sharing one read each other's state.
 */
class SessionPool {
  private readonly idle: string[] = [];
  private readonly waiting: ((cookie: string) => void)[] = [];
  private live = 0;
  created = 0;

  constructor(
    private readonly baseUrl: string,
    private readonly term: string,
    private readonly size: number,
    private readonly signal?: AbortSignal,
  ) {}

  async acquire(): Promise<string> {
    const idle = this.idle.pop();
    if (idle) return idle;

    if (this.live < this.size) {
      this.live++;
      try {
        return await this.open();
      } catch (error) {
        this.live--;
        throw error;
      }
    }

    return new Promise<string>((resolve) => this.waiting.push(resolve));
  }

  release(cookie: string): void {
    const waiter = this.waiting.shift();
    if (waiter) {
      waiter(cookie);
      return;
    }
    this.idle.push(cookie);
  }

  async discard(): Promise<void> {
    this.live--;
    if (this.waiting.length === 0) return;

    // a caller is blocked on a session, so the dead one is replaced eagerly
    this.live++;
    try {
      const fresh = await this.open();
      this.release(fresh);
    } catch {
      this.live--;
    }
  }

  private async open(): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/StudentRegistrationSsb/ssb/term/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: `term=${this.term}&studyPath=&studyPathText=&startDatepicker=&endDatepicker=`,
        signal: this.signal,
      },
    );

    const cookies = response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0].trim())
      .filter((cookie) => cookie.length > 0);

    if (cookies.length === 0) {
      throw new BannerError("banner issued no session cookie", {
        url: `${this.baseUrl}/StudentRegistrationSsb/ssb/term/search`,
        status: response.status,
        attempts: 1,
      });
    }

    this.created++;
    return cookies.join("; ");
  }
}

export class BannerClient {
  private readonly options: Required<
    Omit<BannerClientOptions, "signal" | "emitter">
  >;
  private readonly signal: AbortSignal | undefined;
  private readonly emitter: ScraperEventEmitter | undefined;
  private readonly gate: Gate;
  /** a session is only valid for the term it was opened for */
  private readonly sessions = new Map<string, SessionPool>();

  private requests = 0;
  private retries = 0;
  private failures = 0;

  constructor(options: BannerClientOptions = {}) {
    this.options = {
      baseUrl: options.baseUrl ?? BANNER.baseUrl,
      maxConcurrent: options.maxConcurrent ?? BANNER.maxConcurrent,
      minDelayMs: options.minDelayMs ?? BANNER.minDelayMs,
      maxRetries: options.maxRetries ?? BANNER.maxRetries,
      initialRetryDelayMs:
        options.initialRetryDelayMs ?? BANNER.initialRetryDelayMs,
      maxRetryDelayMs: options.maxRetryDelayMs ?? BANNER.maxRetryDelayMs,
      timeoutMs: options.timeoutMs ?? BANNER.timeoutMs,
      sessionPool: options.sessionPool ?? BANNER.sessionPool,
    };
    this.signal = options.signal;
    this.emitter = options.emitter;
    this.gate = new Gate(this.options.maxConcurrent, this.options.minDelayMs);
  }

  stats(): BannerClientStats {
    let sessionsCreated = 0;
    for (const pool of this.sessions.values()) sessionsCreated += pool.created;

    return {
      requests: this.requests,
      retries: this.retries,
      failures: this.failures,
      inFlight: this.gate.inFlight,
      queued: this.gate.queued,
      sessionsCreated,
    };
  }

  /** One page of the section search; `totalCount` covers the whole term. */
  async searchSections(
    term: string,
    offset: number,
    max: number,
  ): Promise<{
    sections: z.infer<typeof BannerSectionResponse>["data"];
    totalCount: number;
  }> {
    const url =
      `${this.options.baseUrl}/StudentRegistrationSsb/ssb/searchResults/searchResults` +
      `?txt_term=${term}&pageOffset=${offset}&pageMaxSize=${max}`;

    const pool = this.poolFor(term);

    const body = await this.send(url, { step: "sections" }, async () => {
      const cookie = await pool.acquire();
      let stale = false;
      try {
        const response = await this.fetchOnce(url, {
          headers: { Cookie: cookie },
        });
        const text = await response.text();

        // only a 2xx body is JSON; `send` deals with failing statuses
        if (!response.ok) return { response, json: undefined };

        try {
          return { response, json: JSON.parse(text) };
        } catch {
          stale = true;
          throw new StaleSessionError();
        }
      } finally {
        if (stale) await pool.discard();
        else pool.release(cookie);
      }
    });

    const parsed = BannerSectionResponse.safeParse(body);
    if (!parsed.success) {
      throw new BannerError("unexpected section search response", {
        url,
        attempts: 1,
        cause: parsed.error,
      });
    }

    return { sections: parsed.data.data, totalCount: parsed.data.totalCount };
  }

  async subjects(
    term: string,
  ): Promise<z.infer<typeof BannerSubjectsResponse>> {
    const url =
      `${this.options.baseUrl}/StudentRegistrationSsb/ssb/classSearch/get_subject` +
      `?term=${term}&offset=1&max=900`;
    return this.getJson(url, "subjects", BannerSubjectsResponse);
  }

  async campuses(
    term: string,
  ): Promise<z.infer<typeof BannerCampusesResponse>> {
    const url =
      `${this.options.baseUrl}/StudentRegistrationSsb/ssb/classSearch/get_campus` +
      `?searchTerm=&term=${term}&offset=1&max=100`;
    return this.getJson(url, "campuses", BannerCampusesResponse);
  }

  /** Throws unless Banner knows exactly one term with this code. */
  async termDefinition(
    term: string,
  ): Promise<{ code: string; description: string }> {
    const url =
      `${this.options.baseUrl}/StudentRegistrationSsb/ssb/classSearch/getTerms` +
      `?offset=1&max=10&searchTerm=${term}`;
    const terms = await this.getJson(
      url,
      "term-definition",
      BannerTermsResponse,
    );

    const matches = terms.filter((t) => t.code === term);
    if (matches.length !== 1) {
      throw new BannerError(
        matches.length === 0
          ? `banner does not know term ${term}`
          : `banner returned ${matches.length} definitions for term ${term}`,
        { url, attempts: 1 },
      );
    }

    return matches[0];
  }

  /** Faculty assigned to a section; the search endpoint hides these. */
  async facultyMeetingTimes(
    term: string,
    crn: string,
  ): Promise<z.infer<typeof BannerSectionMeetingsFacultyResponse>> {
    const url =
      `${this.options.baseUrl}/StudentRegistrationSsb/ssb/searchResults/getFacultyMeetingTimes` +
      `?term=${term}&courseReferenceNumber=${crn}`;
    return this.getJson(url, "faculty", BannerSectionMeetingsFacultyResponse);
  }

  /** The four detail endpoints below answer with an HTML fragment. */
  async catalogDetails(term: string, crn: string): Promise<string> {
    return this.postForm("getSectionCatalogDetails", "title", term, crn);
  }

  async courseDescription(term: string, crn: string): Promise<string> {
    return this.postForm("getCourseDescription", "description", term, crn);
  }

  async prerequisites(term: string, crn: string): Promise<string> {
    return this.postForm("getSectionPrerequisites", "prereqs", term, crn);
  }

  async corequisites(term: string, crn: string): Promise<string> {
    return this.postForm("getCorequisites", "coreqs", term, crn);
  }

  private async postForm(
    endpoint: string,
    step: string,
    term: string,
    crn: string,
  ): Promise<string> {
    const url = `${this.options.baseUrl}/StudentRegistrationSsb/ssb/searchResults/${endpoint}`;

    const body = await this.send(url, { step }, async () => {
      const response = await this.fetchOnce(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `term=${term}&courseReferenceNumber=${crn}`,
      });
      return { response, json: await response.text() };
    });

    return body as string;
  }

  private poolFor(term: string): SessionPool {
    let pool = this.sessions.get(term);
    if (!pool) {
      pool = new SessionPool(
        this.options.baseUrl,
        term,
        this.options.sessionPool,
        this.signal,
      );
      this.sessions.set(term, pool);
    }
    return pool;
  }

  private async getJson<T>(
    url: string,
    step: string,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const body = await this.send(url, { step }, async () => {
      const response = await this.fetchOnce(url);
      const text = await response.text();
      if (!response.ok) return { response, json: undefined };
      return { response, json: JSON.parse(text) };
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new BannerError(`unexpected ${step} response`, {
        url,
        attempts: 1,
        cause: parsed.error,
      });
    }

    return parsed.data;
  }

  /**
   * Retries behind the concurrency gate. The slot is held across backoff so
   * an unhealthy Banner throttles everything else too.
   */
  private async send(
    url: string,
    meta: { step: string },
    attempt: () => Promise<{ response: Response; json?: unknown }>,
  ): Promise<unknown> {
    const release = await this.gate.enter(this.signal);
    this.requests++;

    try {
      let lastStatus: number | undefined;
      let lastCause: unknown;

      for (let tries = 0; tries <= this.options.maxRetries; tries++) {
        this.throwIfAborted(url, tries);

        try {
          const { response, json } = await attempt();

          if (!isRetryableStatus(response.status)) {
            if (!response.ok) {
              this.failures++;
              throw new BannerError(`banner returned ${response.status}`, {
                url,
                status: response.status,
                attempts: tries + 1,
              });
            }
            return json;
          }

          lastStatus = response.status;
          lastCause = undefined;
        } catch (error) {
          if (error instanceof BannerError) throw error;
          this.throwIfAborted(url, tries);
          lastCause = error;
          lastStatus = undefined;
        }

        if (tries === this.options.maxRetries) break;

        this.retries++;
        const delay = backoffMs(
          tries + 1,
          this.options.initialRetryDelayMs,
          this.options.maxRetryDelayMs,
        );
        this.emitter?.emit("fetch:retry", {
          url,
          step: meta.step,
          attempt: tries + 1,
          delay,
        });
        await sleep(delay, this.signal);
      }

      this.failures++;
      this.emitter?.emit("fetch:error", {
        step: meta.step,
        message: `gave up after ${this.options.maxRetries + 1} attempts`,
      });
      throw new BannerError(
        `banner request failed after ${this.options.maxRetries + 1} attempts`,
        {
          url,
          status: lastStatus,
          attempts: this.options.maxRetries + 1,
          cause: lastCause,
        },
      );
    } finally {
      release();
    }
  }

  private async fetchOnce(url: string, init?: RequestInit): Promise<Response> {
    const timeout = AbortSignal.timeout(this.options.timeoutMs);
    const signal = this.signal
      ? AbortSignal.any([this.signal, timeout])
      : timeout;

    return fetch(url, { ...init, signal });
  }

  private throwIfAborted(url: string, attempts: number): void {
    if (!this.signal?.aborted) return;
    throw new BannerError("banner client aborted", {
      url,
      attempts: attempts + 1,
      cause: this.signal.reason,
    });
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function backoffMs(attempt: number, initial: number, max: number): number {
  const exponential = Math.min(initial * 2 ** (attempt - 1), max);
  return Math.round(exponential + Math.random() * exponential * 0.25);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }

    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    };

    const timer = setTimeout(done, ms);
    signal?.addEventListener("abort", done, { once: true });
  });
}
