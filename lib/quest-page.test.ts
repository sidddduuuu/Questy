import assert from "node:assert/strict";
import test from "node:test";
import { renderQuestPage } from "./quest-page.ts";
import {
  BuildQuestResponseSchema,
  CompleteQuestRequestSchema,
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
  socialPost: "Choose Tuesday's lunch special and join us to try the winner together.",
  imagePrompt: "A polished square restaurant photograph of three lunch dishes in warm natural light.",
  dishChoices: ["Chicken bowl", "Vegetable wrap", "Lentil plate"],
};

test("validates a bounded quest build request", () => {
  assert.equal(QuestBuildRequestSchema.parse(quest).id, quest.id);
  assert.equal(
    QuestBuildRequestSchema.safeParse({ ...quest, id: "../../../secret" }).success,
    false,
  );
});

test("escapes quest content before publishing HTML", () => {
  const html = renderQuestPage(
    { ...quest, title: "<script>alert(1)</script>" },
    "https://images.example/campaign.jpg",
    "https://forms.example/choice",
  );

  assert.equal(html.includes("<script>alert(1)</script>"), false);
  assert.equal(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), true);
  assert.equal(html.includes("Ready-to-send coworker invite"), true);
  assert.equal(html.includes("Tuesday lunch RSVP"), true);
  assert.equal(html.includes("preferred time"), true);
  assert.equal(html.includes("dietary needs"), true);
  assert.equal(html.includes("Open RSVP form"), true);
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

test("requires a complete created campaign bundle", () => {
  const image = { assetType: "image", status: "created" } as const;
  const form = { assetType: "form", status: "created" } as const;
  const page = { assetType: "page", status: "created" } as const;

  assert.equal(BuildQuestResponseSchema.safeParse({ success: true, assets: [image, form, page] }).success, true);
  assert.equal(BuildQuestResponseSchema.safeParse({ success: true, assets: [image, page] }).success, false);
});

test("requires all campaign verification confirmations", () => {
  assert.equal(CompleteQuestRequestSchema.safeParse({ postPublished: true, imagePublished: true, formShared: true }).success, true);
  assert.equal(CompleteQuestRequestSchema.safeParse({ postPublished: true, imagePublished: false, formShared: true }).success, false);
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
  assert.deepEqual(plan.requiredCapabilities, [
    "private invite copy",
    "professional lunch image",
    "coworker RSVP form",
    "hosted invitation page",
  ]);
});
