import { Major, Minor, AuditCourse } from "../types";
import {
  validateMajor,
  MajorValidationResult,
  MajorValidationInputError,
} from "./major-validation";

export enum WorkerMessageType {
  Loaded = "Loaded",
  ValidationResult = "ValidationResult",
  ValidationError = "ValidationError",
}

export type WorkerMessage = Loaded | ValidationResult | ValidationError;

type ValidationResult = {
  type: WorkerMessageType.ValidationResult;
  result: MajorValidationResult;
  requestNumber: number;
};

type ValidationError = {
  type: WorkerMessageType.ValidationError;
  error: {
    name: string;
    message: string;
    field?: string;
    receivedValue?: unknown;
  };
  requestNumber: number;
};

type Loaded = { type: WorkerMessageType.Loaded };

export interface WorkerPostInfo {
  major: Major;
  minor?: Minor;
  taken: AuditCourse<unknown>[];
  concentration?: string;
  requestNumber: number;
}

// Let the host page know the worker is ready.
const loadMessage: Loaded = { type: WorkerMessageType.Loaded };
postMessage(loadMessage);

addEventListener("message", ({ data }: MessageEvent<WorkerPostInfo>) => {
  try {
    const validationResult: ValidationResult = {
      type: WorkerMessageType.ValidationResult,
      result: validateMajor(
        data.major,
        data.taken,
        data.minor,
        data.concentration,
      ),
      requestNumber: data.requestNumber,
    };

    postMessage(validationResult);
  } catch (error) {
    const errorMessage: ValidationError = {
      type: WorkerMessageType.ValidationError,
      error:
        error instanceof MajorValidationInputError
          ? {
              name: error.name,
              message: error.message,
              field: error.field,
              receivedValue: error.receivedValue,
            }
          : {
              name: error instanceof Error ? error.name : "UnknownError",
              message:
                error instanceof Error
                  ? error.message
                  : "An unknown error occurred",
            },
      requestNumber: data.requestNumber,
    };

    postMessage(errorMessage);
  }
});
