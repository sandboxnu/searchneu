/**
 * Event emitter types for scraper operations
 */

import { EventEmitter } from "node:events";

// Generate events
export interface GenerateStartEvent {
  term: string;
}

export interface GenerateSectionsCompleteEvent {
  count: number;
}

export interface GenerateSubjectsStartEvent {}

export interface GenerateSubjectsMismatchEvent {
  bannerCount: number;
  extractedCount: number;
  diff: string[];
}

export interface GenerateTermCompleteEvent {
  term: string;
  description: string;
}

export interface GenerateRequestsQueuedEvent {
  totalCourses: number;
  totalSections: number;
  standardCourses: number;
  standardSections: number;
  specialTopicCourses: number;
  specialTopicSections: number;
  totalRequests: number;
  estimatedMinutes: number;
}

export interface GenerateRequestsProgressEvent {
  remaining: number;
  percentComplete: number;
  activeRequests: number;
}

export interface GenerateCompleteEvent {
  term: string;
}

export interface GenerateErrorEvent {
  error: Error;
  context: string;
}

// Upload events
export interface UploadStartEvent {
  term: string;
}

export interface UploadCampusesCompleteEvent {
  count: number;
}

export interface UploadBuildingsCompleteEvent {
  count: number;
}

export interface UploadSubjectsCompleteEvent {
  count: number;
}

export interface UploadTermCompleteEvent {
  term: string;
}

export interface UploadCoursesCompleteEvent {
  count: number;
}

export interface UploadSectionsCompleteEvent {
  count: number;
}

export interface UploadSectionsRemovedEvent {
  count: number;
  crns: string[];
}

export interface UploadMeetingTimesCompleteEvent {
  count: number;
}

export interface UploadMeetingTimesRemovedEvent {
  count: number;
}

export interface UploadCompleteEvent {
  term: string;
}

export interface UploadErrorEvent {
  error: Error;
  context: string;
}

// Update events
export interface UpdateStartEvent {
  term: string;
}

export interface UpdateSeatsNewEvent {
  crns: string[];
}

export interface UpdateSeatsWaitlistEvent {
  crns: string[];
}

export interface UpdateSectionsNewEvent {
  crns: string[];
}

export interface UpdateSectionsMissingEvent {
  crns: string[];
}

export interface UpdateSectionsUnrootedEvent {
  crns: string[];
}

export interface UpdateCompleteEvent {
  term: string;
  sectionsWithNewSeats: number;
  sectionsWithNewWaitlistSeats: number;
  newSections: number;
}

export interface UpdateErrorEvent {
  error: Error;
  context: string;
}

// Event map for type safety
export interface ScraperEvents {
  // Generate events
  "generate:start": (data: GenerateStartEvent) => void;
  "generate:sections:complete": (data: GenerateSectionsCompleteEvent) => void;
  "generate:subjects:start": (data: GenerateSubjectsStartEvent) => void;
  "generate:subjects:mismatch": (data: GenerateSubjectsMismatchEvent) => void;
  "generate:term:complete": (data: GenerateTermCompleteEvent) => void;
  "generate:requests:queued": (data: GenerateRequestsQueuedEvent) => void;
  "generate:requests:progress": (data: GenerateRequestsProgressEvent) => void;
  "generate:complete": (data: GenerateCompleteEvent) => void;
  "generate:error": (data: GenerateErrorEvent) => void;

  // Upload events
  "upload:start": (data: UploadStartEvent) => void;
  "upload:campuses:complete": (data: UploadCampusesCompleteEvent) => void;
  "upload:buildings:complete": (data: UploadBuildingsCompleteEvent) => void;
  "upload:subjects:complete": (data: UploadSubjectsCompleteEvent) => void;
  "upload:term:complete": (data: UploadTermCompleteEvent) => void;
  "upload:courses:complete": (data: UploadCoursesCompleteEvent) => void;
  "upload:sections:complete": (data: UploadSectionsCompleteEvent) => void;
  "upload:sections:removed": (data: UploadSectionsRemovedEvent) => void;
  "upload:meetingtimes:complete": (
    data: UploadMeetingTimesCompleteEvent,
  ) => void;
  "upload:meetingtimes:removed": (data: UploadMeetingTimesRemovedEvent) => void;
  "upload:complete": (data: UploadCompleteEvent) => void;
  "upload:error": (data: UploadErrorEvent) => void;

  // Update events
  "update:start": (data: UpdateStartEvent) => void;
  "update:seats:new": (data: UpdateSeatsNewEvent) => void;
  "update:seats:waitlist": (data: UpdateSeatsWaitlistEvent) => void;
  "update:sections:new": (data: UpdateSectionsNewEvent) => void;
  "update:sections:missing": (data: UpdateSectionsMissingEvent) => void;
  "update:sections:unrooted": (data: UpdateSectionsUnrootedEvent) => void;
  "update:complete": (data: UpdateCompleteEvent) => void;
  "update:error": (data: UpdateErrorEvent) => void;
}

// Type-safe event emitter
export interface ScraperEventEmitter {
  on<K extends keyof ScraperEvents>(event: K, listener: ScraperEvents[K]): this;
  emit<K extends keyof ScraperEvents>(
    event: K,
    ...args: Parameters<ScraperEvents[K]>
  ): boolean;
  off<K extends keyof ScraperEvents>(
    event: K,
    listener: ScraperEvents[K],
  ): this;
  once<K extends keyof ScraperEvents>(
    event: K,
    listener: ScraperEvents[K],
  ): this;
}

/**
 * Create a new scraper event emitter
 */
export function createScraperEmitter(): ScraperEventEmitter {
  return new EventEmitter() as ScraperEventEmitter;
}
