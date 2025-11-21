import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "trace",
  timestamp: pino.stdTimeFunctions.isoTime,
  base: null,
  transport: {
    target: "pino-pretty",
  },
});
