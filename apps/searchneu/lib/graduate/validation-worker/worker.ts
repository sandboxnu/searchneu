import {
  Major2,
  Minor,
  ScheduleCourse2,
} from "../types";
import { validateMajor2, MajorValidationResult } from "./major2-validation";

type WorkerMessage = Loaded | ValidationResult;

enum WorkerMessageType {
  Loaded = "Loaded",
  ValidationResult = "ValidationResult",
}

type ValidationResult = {
  type: WorkerMessageType.ValidationResult;
  result: MajorValidationResult;
  requestNumber: number;
};

type Loaded = { type: WorkerMessageType.Loaded };

interface WorkerPostInfo {
  major: Major2;
  minor?: Minor;
  taken: ScheduleCourse2<unknown>[];
  concentration?: string;
  requestNumber: number;
}


// Let the host page know the worker is ready.
const loadMessage: Loaded = { type: WorkerMessageType.Loaded };
postMessage(loadMessage);

addEventListener("message", ({ data }: MessageEvent<WorkerPostInfo>) => {
  const validationResult: ValidationResult = {
    type: WorkerMessageType.ValidationResult,
    result: validateMajor2(
      data.major,
      data.taken,
      data.minor,
      data.concentration,
    ),
    requestNumber: data.requestNumber,
  };

  postMessage(validationResult);
});
