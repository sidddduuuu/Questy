import assert from "node:assert/strict";
import test from "node:test";
import { renderQuestPage } from "./quest-page.ts";
import {
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
