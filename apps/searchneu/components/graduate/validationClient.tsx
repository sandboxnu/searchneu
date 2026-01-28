"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "../ui/button";
import {
  WorkerMessageType,
  WorkerMessage,
  WorkerPostInfo,
} from "../../lib/graduate/validation-worker/worker";
import { Major2 } from "@/lib/graduate/types";

type ValidationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: unknown }
  | { status: "error"; error: { name: string; message: string; field?: string } };

export default function ValidationClient() {
  const workerRef = useRef<Worker>(null);
  const [validationState, setValidationState] = useState<ValidationState>({
    status: "idle",
  });
  const requestNumberRef = useRef(0);

  useEffect(() => {
    const worker = new Worker(
      new URL(
        "../../lib/graduate/validation-worker/worker.ts",
        import.meta.url
      )
    );
    workerRef.current = worker;

    // Handle messages from the worker
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;

      switch (message.type) {
        case WorkerMessageType.Loaded:
          console.log("Worker loaded successfully");
          break;

        case WorkerMessageType.ValidationResult:
          console.log("Validation result:", message.result);
          setValidationState({ status: "success", result: message.result });
          break;

        case WorkerMessageType.ValidationError:
          console.error("Validation error:", message.error);
          setValidationState({
            status: "error",
            error: {
              name: message.error.name,
              message: message.error.message,
              field: message.error.field,
            },
          });
          break;
      }
    };

    // Handle uncaught errors in the worker
    worker.onerror = (error: ErrorEvent) => {
      console.error("Worker error:", error);
      setValidationState({
        status: "error",
        error: {
          name: "WorkerError",
          message: error.message || "An unexpected error occurred in the worker",
        },
      });
    };

    // Cleanup on unmount
    return () => {
      worker.terminate();
    };
  }, []);

  const runValidation = useCallback(
    (data: Omit<WorkerPostInfo, "requestNumber">) => {
      if (!workerRef.current) {
        setValidationState({
          status: "error",
          error: {
            name: "WorkerNotReady",
            message: "Worker is not initialized",
          },
        });
        return;
      }

      requestNumberRef.current += 1;
      setValidationState({ status: "loading" });

      const message: WorkerPostInfo = {
        ...data,
        requestNumber: requestNumberRef.current,
      };

      workerRef.current.postMessage(message);
    },
    []
  );

  const testClick = () => {
    // Example: send a test validation request (this will error without valid data)
    runValidation({
      major: null as never, // This will trigger our validation error
      taken: [],
    });
  };

  const major2Example = 
  {
    name: "Test Major",
    requirementSections: [],
    totalCreditsRequired: 0,
    yearVersion: 0,
  };
  const testGoodValidation = () => {
    runValidation({
      major: major2Example as Major2,
      taken: [],
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">ValidationClient</h2>

      <Button variant="outline" onClick={testClick}>
        Test Validation
      </Button>
      <Button variant="outline" onClick={testGoodValidation}>
        Test good Validation
      </Button>

      {validationState.status === "loading" && (
        <p className="text-muted-foreground">Validating...</p>
      )}

      {validationState.status === "error" && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="font-medium text-destructive">
            {validationState.error.name}
          </p>
          <p className="text-sm text-destructive">
            {validationState.error.message}
          </p>
          {validationState.error.field && (
            <p className="text-xs text-muted-foreground mt-1">
              Field: {validationState.error.field}
            </p>
          )}
        </div>
      )}

      {validationState.status === "success" && (
        <div className="p-4 bg-green-500/10 border border-green-500 rounded-md">
          <p className="font-medium text-green-700">Validation Successful</p>
          <pre className="text-xs mt-2 overflow-auto">
            {JSON.stringify(validationState.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}