import { randomUUID } from "node:crypto";
import { GenerateQuestRequestSchema, QuestSchema } from "@/lib/quest";
import { getCustomerContext } from "@/lib/nexla";
import { planQuest } from "@/lib/zero";

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
    const context = await getCustomerContext(input.data.customerId);
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

    const { plan, execution } = await planQuest(context);
    const quest = QuestSchema.parse({
      id: `quest-${context.id}-${randomUUID().slice(0, 8)}`,
      customerId: context.id,
      businessGoal: context.businessGoal,
      ...plan,
      assets: [],
      status: "draft",
      createdAt: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      source: "nexla",
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
