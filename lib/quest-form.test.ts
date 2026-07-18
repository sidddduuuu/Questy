import assert from "node:assert/strict";
import test from "node:test";
import { buildQuestFormRequest } from "./quest-form.ts";
import type { QuestBuildRequest } from "./quest.ts";

const omarQuest: QuestBuildRequest = {
  id: "quest-omar-form",
  customerId: "omar",
  title: "Bring two coworkers Tuesday",
  description: "Invite two coworkers for Tuesday lunch.",
  xpReward: 300,
  businessReward: "20% group discount",
  tier: "Connector",
  requiredCapabilities: ["coworker RSVP form"],
  socialPost: "Team, join me for a quieter Tuesday lunch and choose your preferred meal.",
  imagePrompt: "Professional square restaurant lunch image for a private coworker invitation.",
  dishChoices: ["Chicken bowl", "Vegetable wrap", "Lentil plate"],
};

test("builds Omar's time, meal, and dietary RSVP form", () => {
  const request = buildQuestFormRequest(omarQuest, "owner@example.com");
  const { properties } = request.schema;

  assert.deepEqual(request.schema.required, ["name", "time", "mealChoice"]);
  assert.ok(properties.mealChoice);
  assert.ok(properties.time);
  assert.ok(properties.dietaryNeeds);
  assert.deepEqual(properties.mealChoice.enum, omarQuest.dishChoices);
  assert.deepEqual(properties.time.enum, ["1:30 PM", "2:00 PM", "2:30 PM"]);
  assert.equal(properties.dietaryNeeds.title, "Dietary needs (optional)");
});
