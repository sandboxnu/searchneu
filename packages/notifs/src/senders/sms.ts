import { Twilio } from "twilio";
import type {
  NotificationSender,
  NotificationMessage,
  NotificationResult,
  Logger,
} from "../types";

export interface SMSConfig {
  twilioSid: string;
  twilioAuthToken: string;
  fromPhoneNumber: string;
  logger?: Logger;
}

export class SMSSender implements NotificationSender {
  private client: Twilio;
  private fromPhoneNumber: string;
  private logger?: Logger;

  constructor(config: SMSConfig) {
    this.client = new Twilio(config.twilioSid, config.twilioAuthToken);
    this.fromPhoneNumber = config.fromPhoneNumber;
    this.logger = config.logger;
  }

  getMethod() {
    return "SMS" as const;
  }

  async send(message: NotificationMessage): Promise<NotificationResult> {
    try {
      const result = await this.client.messages.create({
        body: message.body,
        from: this.fromPhoneNumber,
        to: message.to,
      });

      this.logger?.info(`Sent notification text to ${message.to}`);

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (err) {
      const error = err as Error & { code?: number };

      if (error.code === 21610) {
        this.logger?.warn(`${message.to} has unsubscribed from notifications`);
      } else {
        this.logger?.error(
          `Error trying to send notification text to ${message.to}`,
          error,
        );
      }

      return {
        success: false,
        error: error,
      };
    }
  }
}
