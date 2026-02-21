import type { NotificationSender, NotificationMessage, NotificationResult, Logger } from "../types";
export interface SMSConfig {
    twilioSid: string;
    twilioAuthToken: string;
    fromPhoneNumber: string;
    logger?: Logger;
}
export declare class SMSSender implements NotificationSender {
    private client;
    private fromPhoneNumber;
    private logger?;
    constructor(config: SMSConfig);
    getMethod(): "SMS";
    send(message: NotificationMessage): Promise<NotificationResult>;
}
//# sourceMappingURL=sms.d.ts.map