export const logger = {
  debug(message?: unknown, ...optionalParams: unknown[]) {
    console.debug(message, ...optionalParams);
  },
  info(message?: unknown, ...optionalParams: unknown[]) {
    console.info(message, ...optionalParams);
  },
  warn(message?: unknown, ...optionalParams: unknown[]) {
    console.warn(message, ...optionalParams);
  },
  error(message?: unknown, ...optionalParams: unknown[]) {
    console.error(message, ...optionalParams);
  },
};
