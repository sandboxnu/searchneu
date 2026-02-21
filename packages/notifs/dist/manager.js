export class NotificationManager {
    constructor() {
        this.senders = new Map();
    }
    registerSender(sender) {
        this.senders.set(sender.getMethod(), sender);
    }
    async send(method, message) {
        const sender = this.senders.get(method);
        if (!sender) {
            return {
                success: false,
                error: new Error(`no sender registered for method: ${method}`),
            };
        }
        return sender.send(message);
    }
    hasSender(method) {
        return this.senders.has(method);
    }
}
//# sourceMappingURL=manager.js.map