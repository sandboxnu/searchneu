import { Twilio } from "twilio";
export class SMSSender {
    constructor(config) {
        this.client = new Twilio(config.twilioSid, config.twilioAuthToken);
        this.fromPhoneNumber = config.fromPhoneNumber;
        this.logger = config.logger;
    }
    getMethod() {
        return "SMS";
    }
    async send(message) {
        var _a, _b, _c;
        try {
            const result = await this.client.messages.create({
                body: message.body,
                from: this.fromPhoneNumber,
                to: message.to,
            });
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info(`Sent notification text to ${message.to}`);
            return {
                success: true,
                messageId: result.sid,
            };
        }
        catch (err) {
            const error = err;
            if (error.code === 21610) {
                (_b = this.logger) === null || _b === void 0 ? void 0 : _b.warn(`${message.to} has unsubscribed from notifications`);
            }
            else {
                (_c = this.logger) === null || _c === void 0 ? void 0 : _c.error(`Error trying to send notification text to ${message.to}`, error);
            }
            return {
                success: false,
                error: error,
            };
        }
    }
}
//# sourceMappingURL=sms.js.map