import { QuestBuildRequestSchema } from "@/lib/quest";
import { getQuest, markQuestReady } from "@/lib/quest-store";
import { buildQuestCampaign } from "@/lib/zero";

type RouteContext = { params: Promise<{ questId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const quest = QuestBuildRequestSchema.safeParse(body);
  if (!quest.success || quest.data.id !== (await params).questId) {
    return Response.json(
      { success: false, error: "Invalid quest build request" },
      { status: 400 },
    );
  }

  try {
    const storedQuest = getQuest(quest.data.id);
    if (!storedQuest) {
      return Response.json(
        { success: false, error: "Generate the quest before building it" },
        { status: 404 },
      );
    }

    const assets = await buildQuestCampaign(
      QuestBuildRequestSchema.parse(storedQuest),
    );
    markQuestReady(storedQuest.id, assets);
    return Response.json({ success: true, assets });
  } catch (error) {
    console.error("Quest campaign build failed", error);
    return Response.json(
      { success: false, error: "Zero campaign creation is unavailable" },
      { status: 502 },
    );
  }
}
