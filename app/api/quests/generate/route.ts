import { randomUUID } from "node:crypto";
import {
  fallbackQuestPlan,
  GenerateQuestRequestSchema,
  QuestSchema,
} from "@/lib/quest";
import { saveQuest } from "@/lib/quest-store";
import type { CustomerContext } from "@/lib/customer";
import { getCustomerContext } from "@/lib/nexla";
import { planQuest, type QuestPlanResult } from "@/lib/zero";

async function planQuestWithRecovery(
  customer: CustomerContext,
): Promise<QuestPlanResult> {
  try {
    return await planQuest(customer);
  } catch {
    try {
      return await planQuest(customer);
    } catch {
      return {
        plan: fallbackQuestPlan(customer),
        execution: {
          status: "fallback",
          provider: "QuestLoop deterministic recovery",
          model: "persona rules",
          runId: `fallback-${customer.id}`,
          cost: 0,
          reviewed: false,
          capabilityToken: "local-recovery",
        },
      };
    }
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const input = GenerateQuestRequestSchema.safeParse(body);
  if (!input.success) {
    return Response.json(
      { success: false, error: "Invalid quest generation request" },
      { status: 400 },
    );
  }

  try {
    const { context, source } = await getCustomerContext(input.data.customerId);
    if (!context) {
      return Response.json(
        { success: false, error: "Customer context not found" },
        { status: 404 },
      );
    }
    if (context.businessGoal !== input.data.businessGoal) {
      return Response.json(
        { success: false, error: "Business goal does not match customer context" },
        { status: 400 },
      );
    }

    const { plan, execution } = await planQuestWithRecovery(context);
    const quest = saveQuest(
      QuestSchema.parse({
        id: `quest-${context.id}-${randomUUID().slice(0, 8)}`,
        customerId: context.id,
        businessGoal: context.businessGoal,
        ...plan,
        assets: [],
        status: "draft",
        createdAt: new Date().toISOString(),
      }),
    );

    return Response.json({
      success: true,
      source,
      quest,
      planner: execution,
    });
  } catch {
    return Response.json(
      { success: false, error: "Quest planning is unavailable" },
      { status: 502 },
    );
  }
}
