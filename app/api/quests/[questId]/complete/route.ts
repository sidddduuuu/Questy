import { getCustomerContext } from "@/lib/nexla";
import { canCompleteQuest, verifyPomeriumIdentity } from "@/lib/pomerium";
import {
  CompleteQuestRequestSchema,
  QuestIdSchema,
  tierForXp,
  type Quest,
} from "@/lib/quest";
import { getQuest, markQuestCompleted } from "@/lib/quest-store";

type RouteContext = { params: Promise<{ questId: string }> };

function errorResponse(error: string, status: number) {
  return Response.json({ success: false, error }, { status });
}

async function awardQuest(quest: Quest, subject: string) {
  try {
    const { context: customer } = await getCustomerContext(quest.customerId);
    if (!customer) return errorResponse("Customer context not found", 404);

    const totalXp = customer.currentXp + quest.xpReward;
    const newTier = tierForXp(totalXp);
    if (!markQuestCompleted(quest.id, new Date().toISOString())) {
      return errorResponse("Quest is already completed", 409);
    }

    return Response.json({
      success: true,
      identity: { provider: "pomerium", subject },
      xpAwarded: quest.xpReward,
      totalXp,
      oldTier: customer.currentTier,
      newTier,
      promoted: newTier !== customer.currentTier,
    });
  } catch {
    return errorResponse("Quest completion is unavailable", 502);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const questId = QuestIdSchema.safeParse((await params).questId);
  if (!questId.success) return errorResponse("Invalid quest", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Quest verification must be valid JSON", 400);
  }
  if (!CompleteQuestRequestSchema.safeParse(body).success) {
    return errorResponse("Confirm the campaign copy, image, and form before completing", 400);
  }

  let identity;
  try {
    identity = await verifyPomeriumIdentity(request);
  } catch {
    return errorResponse("Pomerium identity verification failed", 401);
  }

  const quest = getQuest(questId.data);
  if (!quest) return errorResponse("Quest not found", 404);
  if (!canCompleteQuest(identity, quest.customerId)) {
    return errorResponse("This identity cannot complete this quest", 403);
  }
  if (quest.status === "completed") {
    return errorResponse("Quest is already completed", 409);
  }
  if (quest.status !== "ready") {
    return errorResponse("Build the quest before completing it", 409);
  }

  return awardQuest(quest, identity.sub);
}
