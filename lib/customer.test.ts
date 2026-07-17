import assert from "node:assert/strict";
import test from "node:test";
import { CustomerContextSchema, CustomerIdSchema } from "./customer.ts";

test("accepts the supported customer IDs", () => {
  assert.equal(CustomerIdSchema.parse("maya"), "maya");
  assert.equal(CustomerIdSchema.safeParse("unknown").success, false);
});

test("rejects malformed customer context", () => {
  const result = CustomerContextSchema.safeParse({
    id: "maya",
    name: "Maya",
    currentXp: -1,
  });

  assert.equal(result.success, false);
});

test("normalizes Nexla numeric strings without accepting blanks", () => {
  const context = {
    id: "omar",
    name: "Omar",
    persona: "office_connector",
    visitPattern: "weekday lunch",
    sharingStyle: "private",
    commonGroup: "coworkers",
    favoriteProduct: "lunch combinations",
    currentXp: "780",
    currentTier: "Connector",
    previousQuestResult: "completed",
    businessGoal: "Fill quiet Tuesday afternoons with new customers",
  };

  assert.equal(CustomerContextSchema.parse(context).currentXp, 780);
  assert.equal(
    CustomerContextSchema.safeParse({ ...context, currentXp: "" }).success,
    false,
  );
});
