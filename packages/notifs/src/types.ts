export type NotificationMethod = "SMS";

export interface NotificationMessage {
  to: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  error?: Error;
  messageId?: string;
}

export interface Logger {
  debug(message?: any, ...optionalParams: any[]): void;
  info(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]): void;
}

export interface NotificationSender {
  send(message: NotificationMessage): Promise<NotificationResult>;
  getMethod(): NotificationMethod;
}
