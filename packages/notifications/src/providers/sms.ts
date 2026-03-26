import type { NotificationProvider } from "../types";

export interface TwilioSMSProviderOptions {
  client: {
    messages: {
      create: (opts: {
        body: string;
        from: string;
        to: string;
      }) => Promise<unknown>;
    };
  };
  fromNumber: string;
}

export class TwilioSMSProvider implements NotificationProvider {
  readonly method = "SMS";
  private client: TwilioSMSProviderOptions["client"];
  private fromNumber: string;

  constructor(opts: TwilioSMSProviderOptions) {
    this.client = opts.client;
    this.fromNumber = opts.fromNumber;
  }

  async send(to: string, message: string): Promise<void> {
    await this.client.messages.create({
      body: message,
      from: this.fromNumber,
      to,
    });
  }
}
