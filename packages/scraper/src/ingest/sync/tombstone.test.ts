import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  planTombstones,
  type TombstoneCandidate,
  type TombstonePolicy,
} from "./tombstone";

const NOW = new Date("2026-02-01T00:00:00.000Z");
const HOUR = 60 * 60 * 1000;

const policy: TombstonePolicy = { afterMs: 6 * HOUR };

function ago(ms: number): Date {
  return new Date(NOW.getTime() - ms);
}

function row(overrides: Partial<TombstoneCandidate> = {}): TombstoneCandidate {
  return {
    id: 1,
    key: "70001",
    missingSince: null,
    tombstonedAt: null,
    ...overrides,
  };
}

const present = new Set(["70001"]);
const absent = new Set<string>();

describe("planTombstones", () => {
  test("leaves a row Banner still lists alone", () => {
    assert.deepEqual(planTombstones([row()], present, policy, NOW), []);
  });

  test("tombstones once the row has been missing long enough", () => {
    const [change] = planTombstones(
      [row({ missingSince: ago(6 * HOUR) })],
      absent,
      policy,
      NOW,
    );

    assert.equal(change.action, "tombstone");
    assert.deepEqual(change.tombstonedAt, NOW);
    // kept, so a reap can tell how long the row has been gone
    assert.deepEqual(change.missingSince, ago(6 * HOUR));
  });

  test("clears a row that comes back", () => {
    const [change] = planTombstones(
      [row({ missingSince: ago(1 * HOUR) })],
      present,
      policy,
      NOW,
    );

    assert.equal(change.action, "restore");
    assert.equal(change.missingSince, null);
    assert.equal(change.tombstonedAt, null);
  });

  test("clears a row that comes back after being tombstoned", () => {
    // restoring beats deleting and re-inserting, which would orphan every
    // tracker pointing at the old row
    const [change] = planTombstones(
      [row({ missingSince: ago(99 * HOUR), tombstonedAt: ago(48 * HOUR) })],
      present,
      policy,
      NOW,
    );

    assert.equal(change.action, "restore");
    assert.equal(change.tombstonedAt, null);
  });

  test("reaches a tombstone after the threshold and no sooner", () => {
    let candidate = row();
    const actions: string[] = [];

    // a pass every 5 minutes for 7 hours
    for (let minute = 0; minute <= 7 * 60; minute += 5) {
      const at = new Date(NOW.getTime() + minute * 60 * 1000);
      const [change] = planTombstones([candidate], absent, policy, at);
      if (!change) continue;

      actions.push(`${change.action}@${minute}`);
      candidate = { ...candidate, ...change };
    }

    assert.deepEqual(actions, ["mark@0", "tombstone@360"]);
  });
});
