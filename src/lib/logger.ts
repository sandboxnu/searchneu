import "server-only";
import pino from "pino";

const isProd = process.env.IS_PROD;

const logger = isProd
  ? pino({
      level: process.env.LOG_LEVEL ?? "info",
      timestamp: () => `,"time":"${new Date().toLocaleString()}"`,
    })
  : pino({
      level: process.env.LOG_LEVEL ?? "debug",
      timestamp: () => `,"time":"${new Date().toLocaleString()}"`,
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    });

export default logger;
