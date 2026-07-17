import assert from "node:assert/strict";
import test from "node:test";
import { createLocalQuestAsset, renderQuestPage } from "./quest-page.ts";
import {
  fallbackQuestPlan,
  QuestBuildRequestSchema,
  QuestPlanSchema,
  type QuestBuildRequest,
} from "./quest.ts";

const quest: QuestBuildRequest = {
  id: "omar-lunch-001",
  customerId: "omar",
  title: "Bring two coworkers for Tuesday lunch",
  description: "Invite two coworkers to a private group lunch.",
  xpReward: 300,
  businessReward: "20% group discount",
  tier: "Connector",
  requiredCapabilities: ["private invitation page", "RSVP form"],
};

test("validates a bounded quest build request", () => {
  assert.equal(QuestBuildRequestSchema.parse(quest).id, quest.id);
  assert.equal(
    QuestBuildRequestSchema.safeParse({ ...quest, id: "../../../secret" }).success,
    false,
  );
});

test("escapes quest content before publishing HTML", () => {
  const html = renderQuestPage({ ...quest, title: "<script>alert(1)</script>" });

  assert.equal(html.includes("<script>alert(1)</script>"), false);
  assert.equal(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), true);
});

test("rejects quest plans that exceed prompt word limits", () => {
  const plan = {
    ...quest,
    rationale: "Matches Omar's private coworker sharing style.",
  };

  assert.equal(QuestPlanSchema.safeParse(plan).success, true);
  assert.equal(
    QuestPlanSchema.safeParse({
      ...plan,
      title: "one two three four five six seven eight nine ten",
    }).success,
    false,
  );
});

test("creates a usable local asset when Zero hosting fails", () => {
  const asset = createLocalQuestAsset(
    quest.id,
    `https://questloop.test/api/quests/${quest.id}/build`,
  );

  assert.equal(asset.status, "fallback");
  assert.equal(asset.url, `https://questloop.test/quest/${quest.id}`);
});

test("recovers with a persona-specific quest plan", () => {
  const plan = fallbackQuestPlan({
    id: "omar",
    name: "Omar",
    persona: "office_connector",
    visitPattern: "weekday lunch",
    sharingStyle: "private",
    commonGroup: "coworkers",
    favoriteProduct: "lunch combinations",
    currentXp: 780,
    currentTier: "Connector",
    businessGoal: "Fill quiet Tuesday afternoons with new customers",
  });

  assert.equal(plan.title, "Bring two coworkers Tuesday");
  assert.equal(plan.requiredCapabilities.includes("private invitation page"), true);
});
