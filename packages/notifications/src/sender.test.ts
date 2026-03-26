import assert from "node:assert";
import { describe, test } from "node:test";
import { sendNotifications } from "./sender";
import type { Notif, NotificationProvider, TypedNotif } from "./types";

function makeNotif(overrides: Partial<Notif> = {}): Notif {
  return {
    id: 1,
    term: "202510",
    sectionCrn: "12345",
    uid: "user-1",
    method: "SMS",
    count: 0,
    limit: 3,
    courseSubject: "CS",
    courseNumber: "3500",
    phoneNumber: "+11234567890",
    phoneNumberVerified: true,
    ...overrides,
  };
}

function makeProvider(): NotificationProvider & { calls: { to: string; message: string }[] } {
  const calls: { to: string; message: string }[] = [];
  return {
    method: "SMS",
    calls,
    async send(to: string, message: string) {
      calls.push({ to, message });
    },
  };
}

function makeDb() {
  const ops: { type: string; args: any[] }[] = [];

  const chainable = (type: string) => {
    const chain: any = {
      set(...args: any[]) {
        ops.push({ type: `${type}.set`, args });
        return chain;
      },
      where(...args: any[]) {
        ops.push({ type: `${type}.where`, args });
        return chain;
      },
      values(...args: any[]) {
        ops.push({ type: `${type}.values`, args });
        return chain;
      },
      catch(fn: any) {
        return chain;
      },
      then(resolve: any) {
        resolve?.();
        return chain;
      },
    };
    return chain;
  };

  return {
    ops,
    update(_table: any) {
      ops.push({ type: "update", args: [_table] });
      return chainable("update");
    },
    insert(_table: any) {
      ops.push({ type: "insert", args: [_table] });
      return chainable("insert");
    },
  };
}

function silentLogger() {
  return {
    info: () => {},
    warn: () => {},
    error: () => {},
  };
}

describe("sendNotifications", () => {
  test("skips when no phone number", async () => {
    const provider = makeProvider();
    const db = makeDb();
    const notifications: TypedNotif[] = [
      { notif: makeNotif({ phoneNumber: null }), type: "seats_opened" },
    ];

    await sendNotifications(notifications, db, provider, silentLogger());
    assert.strictEqual(provider.calls.length, 0);
  });

  test("skips when not verified", async () => {
    const provider = makeProvider();
    const db = makeDb();
    const notifications: TypedNotif[] = [
      {
        notif: makeNotif({ phoneNumberVerified: false }),
        type: "seats_opened",
      },
    ];

    await sendNotifications(notifications, db, provider, silentLogger());
    assert.strictEqual(provider.calls.length, 0);
  });

  test("soft-deletes when count >= limit", async () => {
    const provider = makeProvider();
    const db = makeDb();
    const notifications: TypedNotif[] = [
      {
        notif: makeNotif({ count: 3, limit: 3 }),
        type: "seats_opened",
      },
    ];

    await sendNotifications(notifications, db, provider, silentLogger());
    assert.strictEqual(provider.calls.length, 0);
    assert.ok(db.ops.some((op) => op.type === "update"));
  });

  test("calls provider.send with correct message", async () => {
    const provider = makeProvider();
    const db = makeDb();
    const notif = makeNotif();
    const notifications: TypedNotif[] = [
      { notif, type: "seats_opened" },
    ];

    await sendNotifications(notifications, db, provider, silentLogger());
    assert.strictEqual(provider.calls.length, 1);
    assert.strictEqual(provider.calls[0].to, "+11234567890");
    assert.ok(provider.calls[0].message.includes("A seat opened up in CS 3500"));
  });

  test("handles error code 21610 (unsubscribe)", async () => {
    const provider: NotificationProvider = {
      method: "SMS",
      async send() {
        const err: any = new Error("Unsubscribed");
        err.code = 21610;
        throw err;
      },
    };
    const db = makeDb();
    const notifications: TypedNotif[] = [
      { notif: makeNotif(), type: "seats_opened" },
    ];

    await sendNotifications(notifications, db, provider, silentLogger());
    // Should have called update to soft-delete all user's trackers
    const updateOps = db.ops.filter((op) => op.type === "update");
    assert.ok(updateOps.length > 0);
  });
});
