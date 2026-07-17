import assert from "node:assert/strict";
import test from "node:test";
import {
  canCompleteQuest,
  verifyPomeriumIdentity,
  type PomeriumIdentity,
} from "./pomerium.ts";
import {
  markQuestCompleted,
  markQuestReady,
  saveQuest,
} from "./quest-store.ts";
import type { Quest } from "./quest.ts";
import { tierForXp } from "./quest.ts";

test("authorizes only the matching customer or a QuestLoop admin", () => {
  const identity: PomeriumIdentity = {
    sub: "user-1",
    groups: [],
    customer_id: "omar",
  };

  assert.equal(canCompleteQuest(identity, "omar"), true);
  assert.equal(canCompleteQuest(identity, "maya"), false);
  assert.equal(
    canCompleteQuest({ sub: "admin-1", groups: ["questloop-admin"] }, "maya"),
    true,
  );
});

test("rejects requests that did not pass through Pomerium", async () => {
  await assert.rejects(
    verifyPomeriumIdentity(new Request("https://questloop.test")),
    /Missing Pomerium assertion/,
  );
});

test("promotes customers at the demo XP boundaries", () => {
  assert.equal(tierForXp(999), "Connector");
  assert.equal(tierForXp(1_000), "Organizer");
  assert.equal(tierForXp(2_000), "Ambassador");
});

test("awards a stored quest only once", () => {
  const quest: Quest = {
    id: "quest-omar-test",
    customerId: "omar",
    businessGoal: "Fill quiet Tuesdays",
    title: "Bring coworkers Tuesday",
    description: "Invite two coworkers for lunch this Tuesday.",
    rationale: "Omar connects with coworkers.",
    xpReward: 300,
    businessReward: "20% group discount",
    tier: "Connector",
    requiredCapabilities: ["private invitation page"],
    assets: [],
    status: "draft",
    createdAt: "2026-07-17T00:00:00.000Z",
  };
  saveQuest(quest);
  markQuestReady(quest.id, { assetType: "page", status: "created" });

  assert.equal(Boolean(markQuestCompleted(quest.id, quest.createdAt)), true);
  assert.equal(markQuestCompleted(quest.id, quest.createdAt), undefined);
});
