import { z } from "zod";
import { CustomerIdSchema } from "./customer.ts";

const underWords = (limit: number) => (value: string) =>
  value.trim().split(/\s+/).length < limit;

export const QuestIdSchema = z.string().regex(/^[a-z0-9-]{3,48}$/);

export const QuestPlanSchema = z.object({
  title: z.string().min(1).max(80).refine(underWords(10)),
  description: z.string().min(1).max(300).refine(underWords(35)),
  rationale: z.string().min(1).max(400),
  xpReward: z.number().int().min(100).max(1_000),
  businessReward: z.string().min(1).max(120),
  tier: z.enum(["Explorer", "Connector", "Organizer", "Ambassador"]),
  requiredCapabilities: z.array(z.string().min(1).max(80)).min(1).max(5),
});

export const GenerateQuestRequestSchema = z.object({
  customerId: CustomerIdSchema,
  businessGoal: z.string().min(1).max(200),
});

export const QuestBuildRequestSchema = z.object({
  id: QuestIdSchema,
  customerId: CustomerIdSchema,
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  xpReward: z.number().int().positive().max(10_000),
  businessReward: z.string().min(1).max(120),
  tier: z.enum(["Explorer", "Connector", "Organizer", "Ambassador"]),
  requiredCapabilities: z.array(z.string().min(1).max(80)).min(1).max(8),
});

export const ZeroQuestAssetSchema = z.object({
  assetType: z.enum(["page", "form", "qr", "image", "other"]),
  provider: z.string().optional(),
  url: z.url().optional(),
  runId: z.string().optional(),
  cost: z.number().nonnegative().optional(),
  status: z.enum(["created", "failed", "fallback"]),
  raw: z.unknown().optional(),
});

export const QuestSchema = QuestPlanSchema.extend({
  id: QuestIdSchema,
  customerId: CustomerIdSchema,
  businessGoal: z.string().min(1),
  assets: z.array(ZeroQuestAssetSchema),
  status: z.enum(["draft", "planning", "building", "ready", "completed", "failed"]),
  createdAt: z.iso.datetime(),
  completedAt: z.iso.datetime().optional(),
});

export type QuestPlan = z.infer<typeof QuestPlanSchema>;
export type QuestBuildRequest = z.infer<typeof QuestBuildRequestSchema>;
export type Quest = z.infer<typeof QuestSchema>;
export type ZeroQuestAsset = z.infer<typeof ZeroQuestAssetSchema>;

export function tierForXp(xp: number): Quest["tier"] {
  if (xp >= 2_000) return "Ambassador";
  if (xp >= 1_000) return "Organizer";
  if (xp >= 500) return "Connector";
  return "Explorer";
}
