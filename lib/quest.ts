import { z } from "zod";
import { CustomerIdSchema } from "./customer.ts";

export const QuestBuildRequestSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{3,48}$/),
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

export type QuestBuildRequest = z.infer<typeof QuestBuildRequestSchema>;
export type ZeroQuestAsset = z.infer<typeof ZeroQuestAssetSchema>;
