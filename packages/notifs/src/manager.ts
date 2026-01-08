import type {
  NotificationSender,
  NotificationMethod,
  NotificationMessage,
  NotificationResult,
} from "./types";

export class NotificationManager {
  private senders: Map<NotificationMethod, NotificationSender> = new Map();

  registerSender(sender: NotificationSender): void {
    this.senders.set(sender.getMethod(), sender);
  }

  async send(
    method: NotificationMethod,
    message: NotificationMessage,
  ): Promise<NotificationResult> {
    const sender = this.senders.get(method);

    if (!sender) {
      return {
        success: false,
        error: new Error(`no sender registered for method: ${method}`),
      };
    }

    return sender.send(message);
  }

  hasSender(method: NotificationMethod): boolean {
    return this.senders.has(method);
  }
}
