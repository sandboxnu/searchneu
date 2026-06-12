import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { sendNotifications, type Notif, type NotificationSender } from "./notifs";

function makeNotif(overrides: Partial<Notif> = {}): Notif {
  return {
    id: 1,
    term: "202510",
    sectionCrn: "12345",
    uid: "user1",
    method: "SMS",
    count: 0,
    limit: 5,
    courseSubject: "CS",
    courseNumber: "2500",
    phoneNumber: "+11234567890",
    phoneNumberVerified: true,
    ...overrides,
  };
}

function makeSender(): NotificationSender & { calls: Array<{ to: string; message: string }> } {
  const calls: Array<{ to: string; message: string }> = [];
  return {
    calls,
    async sendSMS(to: string, message: string) {
      calls.push({ to, message });
    },
  };
}

/** Creates a chainable mock db that records calls. */
function makeMockDb() {
  const calls: Array<{ method: string; args: unknown[] }> = [];

  function chainable(): any {
    const chain: any = {
      set(...args: unknown[]) {
        calls.push({ method: "set", args });
        return chain;
      },
      where(...args: unknown[]) {
        calls.push({ method: "where", args });
        return Promise.resolve();
      },
      values(...args: unknown[]) {
        calls.push({ method: "values", args });
        return chain;
      },
      catch(fn: (err: Error) => void) {
        return Promise.resolve().catch(fn);
      },
    };
    return chain;
  }

  return {
    calls,
    update() {
      calls.push({ method: "update", args: [] });
      return chainable();
    },
    insert() {
      calls.push({ method: "insert", args: [] });
      return chainable();
    },
  };
}

function makeLogger() {
  const logs: Array<{ level: string; msg: string }> = [];
  return {
    logs,
    info(msg: string) {
      logs.push({ level: "info", msg });
    },
    warn(msg: string) {
      logs.push({ level: "warn", msg });
    },
    error(msg: string) {
      logs.push({ level: "error", msg });
    },
  };
}

describe("sendNotifications", () => {
  test("sends SMS for seat notifications with correct message format", async () => {
    const sender = makeSender();
    const db = makeMockDb();
    const logger = makeLogger();
    const notif = makeNotif();

    await sendNotifications([notif], [], db as any, sender, logger);

    assert.equal(sender.calls.length, 1);
    assert.equal(sender.calls[0].to, "+11234567890");
    assert.ok(sender.calls[0].message.includes("A seat opened up in CS 2500"));
    assert.ok(sender.calls[0].message.includes("CRN: 12345"));
    assert.ok(
      sender.calls[0].message.includes(
        "https://searchneu.com/catalog/202510/CS%202500",
      ),
    );
  });

  test("sends SMS for waitlist notifications with different message format", async () => {
    const sender = makeSender();
    const db = makeMockDb();
    const logger = makeLogger();
    const notif = makeNotif();

    await sendNotifications([], [notif], db as any, sender, logger);

    assert.equal(sender.calls.length, 1);
    assert.ok(
      sender.calls[0].message.includes("A waitlist seat has opened up in CS 2500"),
    );
  });

  test("skips notifications when phoneNumber is null", async () => {
    const sender = makeSender();
    const db = makeMockDb();
    const logger = makeLogger();
    const notif = makeNotif({ phoneNumber: null });

    await sendNotifications([notif], [], db as any, sender, logger);

    assert.equal(sender.calls.length, 0);
  });

  test("skips notifications when phoneNumberVerified is false", async () => {
    const sender = makeSender();
    const db = makeMockDb();
    const logger = makeLogger();
    const notif = makeNotif({ phoneNumberVerified: false });

    await sendNotifications([notif], [], db as any, sender, logger);

    assert.equal(sender.calls.length, 0);
  });

  test("when count >= limit, marks tracker as deleted without sending SMS", async () => {
    const sender = makeSender();
    const db = makeMockDb();
    const logger = makeLogger();
    const notif = makeNotif({ count: 5, limit: 5 });

    await sendNotifications([notif], [], db as any, sender, logger);

    assert.equal(sender.calls.length, 0);
    assert.ok(db.calls.some((c) => c.method === "update"));
  });

  test("on successful SMS: logs notification and updates tracker", async () => {
    const sender = makeSender();
    const db = makeMockDb();
    const logger = makeLogger();
    const notif = makeNotif();

    await sendNotifications([notif], [], db as any, sender, logger);

    assert.ok(logger.logs.some((l) => l.level === "info" && l.msg.includes("+11234567890")));
    // insert for notification log, update for message count
    assert.ok(db.calls.some((c) => c.method === "insert"));
    assert.ok(db.calls.some((c) => c.method === "update"));
  });

  test("on Twilio error 21610: deletes all trackers for that user", async () => {
    const sender: NotificationSender = {
      async sendSMS() {
        const err = new Error("Unsubscribed") as Error & { code: number };
        err.code = 21610;
        throw err;
      },
    };
    const db = makeMockDb();
    const logger = makeLogger();
    const notif = makeNotif();

    await sendNotifications([notif], [], db as any, sender, logger);

    assert.ok(logger.logs.some((l) => l.level === "warn" && l.msg.includes("unsubscribed")));
    assert.ok(db.calls.some((c) => c.method === "update"));
  });

  test("on generic error: logs error message", async () => {
    const sender: NotificationSender = {
      async sendSMS() {
        throw new Error("Something went wrong");
      },
    };
    const db = makeMockDb();
    const logger = makeLogger();
    const notif = makeNotif();

    await sendNotifications([notif], [], db as any, sender, logger);

    assert.ok(
      logger.logs.some(
        (l) => l.level === "error" && l.msg.includes("+11234567890"),
      ),
    );
  });
});
