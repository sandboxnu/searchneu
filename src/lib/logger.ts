import pino from "pino";
import "pino-pretty";

const isDev = !process.env.IS_PROD;

// TODO: Adding pino pretty target causes error
const logger = pino({
  // transport: !isDev
  //   ? undefined
  //   : {
  //       target: "pino-pretty",
  //       options: {
  //         colorize: true,
  //       },
  //     },
  timestamp: () => `,"time":"${new Date().toLocaleString()}"`,
  level: process.env.LOG_LEVEL || "info",
});

export default logger;
