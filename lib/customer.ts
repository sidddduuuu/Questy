import { z } from "zod";

export const CustomerIdSchema = z.enum(["maya", "omar", "lena"]);

const NonNegativeIntegerSchema = z
  .union([z.number(), z.string().regex(/^\d+$/)])
  .transform(Number)
  .pipe(z.number().int().nonnegative());

export const CustomerContextSchema = z.object({
  id: CustomerIdSchema,
  name: z.string().min(1),
  persona: z.enum([
    "social_creator",
    "office_connector",
    "community_organizer",
  ]),
  visitPattern: z.string().min(1),
  sharingStyle: z.enum(["public", "private", "group"]),
  commonGroup: z.string().min(1),
  favoriteProduct: z.string().min(1),
  currentXp: NonNegativeIntegerSchema,
  currentTier: z.enum(["Explorer", "Connector", "Organizer", "Ambassador"]),
  previousQuestResult: z.enum(["completed", "ignored", "failed"]).optional(),
  businessGoal: z.string().min(1),
});

export type CustomerId = z.infer<typeof CustomerIdSchema>;
export type CustomerContext = z.infer<typeof CustomerContextSchema>;
