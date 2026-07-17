import { z } from "zod";
import {
  CustomerIdSchema,
  type CustomerContext,
  type CustomerId,
} from "./customer.ts";

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

export const QuestPlannerExecutionSchema = z.object({
  status: z.enum(["created", "fallback"]),
  provider: z.string().min(1),
  model: z.string().min(1),
  runId: z.string().min(1),
  cost: z.number().nonnegative(),
  reviewed: z.boolean(),
  capabilityToken: z.string().min(1),
});

export const GenerateQuestResponseSchema = z.object({
  success: z.literal(true),
  source: z.enum(["nexla", "nexla-cache"]),
  quest: QuestSchema,
  planner: QuestPlannerExecutionSchema,
});

export const BuildQuestResponseSchema = z.object({
  success: z.literal(true),
  asset: ZeroQuestAssetSchema,
});

export const CompleteQuestResponseSchema = z.object({
  success: z.literal(true),
  identity: z.object({
    provider: z.literal("pomerium"),
    subject: z.string().min(1),
  }),
  xpAwarded: z.number().int().positive(),
  totalXp: z.number().int().nonnegative(),
  oldTier: z.enum(["Explorer", "Connector", "Organizer", "Ambassador"]),
  newTier: z.enum(["Explorer", "Connector", "Organizer", "Ambassador"]),
  promoted: z.boolean(),
});

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string().min(1),
});

export type QuestPlan = z.infer<typeof QuestPlanSchema>;
export type QuestBuildRequest = z.infer<typeof QuestBuildRequestSchema>;
export type Quest = z.infer<typeof QuestSchema>;
export type ZeroQuestAsset = z.infer<typeof ZeroQuestAssetSchema>;
export type QuestPlannerExecution = z.infer<typeof QuestPlannerExecutionSchema>;
export type QuestCompletion = z.infer<typeof CompleteQuestResponseSchema>;

const fallbackPlans = {
  maya: {
    title: "Let friends choose Tuesday's drink",
    description: "Share a three-choice drink poll and bring one voter to try the winning drink this Tuesday.",
    rationale: "Maya already shares publicly with friends and followers.",
    xpReward: 180,
    businessReward: "Free drink for both",
    requiredCapabilities: ["hosted poll page", "social graphic", "trackable link"],
  },
  omar: {
    title: "Bring two coworkers Tuesday",
    description: "Invite two coworkers to a private group lunch between 1:30 PM and 3:00 PM this Tuesday.",
    rationale: "Omar naturally connects with coworkers during weekday lunch.",
    xpReward: 300,
    businessReward: "20% group discount",
    requiredCapabilities: ["private invitation page", "RSVP form", "QR code"],
  },
  lena: {
    title: "Host a Tuesday tasting",
    description: "Invite three local parents to a four-person tasting during Tuesday afternoon.",
    rationale: "Lena already organizes group experiences for local parents.",
    xpReward: 650,
    businessReward: "Host visits free",
    requiredCapabilities: ["event page", "group registration form", "invitation card"],
  },
} satisfies Record<CustomerId, Omit<QuestPlan, "tier">>;

export function fallbackQuestPlan(customer: CustomerContext): QuestPlan {
  return QuestPlanSchema.parse({
    ...fallbackPlans[customer.id],
    tier: customer.currentTier,
  });
}

export function tierForXp(xp: number): Quest["tier"] {
  if (xp >= 2_000) return "Ambassador";
  if (xp >= 1_000) return "Organizer";
  if (xp >= 500) return "Connector";
  return "Explorer";
}
