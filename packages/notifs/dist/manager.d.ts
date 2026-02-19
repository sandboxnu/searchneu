import type { NotificationSender, NotificationMethod, NotificationMessage, NotificationResult } from "./types";
export declare class NotificationManager {
    private senders;
    registerSender(sender: NotificationSender): void;
    send(method: NotificationMethod, message: NotificationMessage): Promise<NotificationResult>;
    hasSender(method: NotificationMethod): boolean;
}
//# sourceMappingURL=manager.d.ts.map