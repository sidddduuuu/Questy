import { QuestBuildRequestSchema } from "@/lib/quest";
import { createLocalQuestAsset } from "@/lib/quest-page";
import { getQuest, markQuestReady } from "@/lib/quest-store";
import { publishQuestPage } from "@/lib/zero";

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

    const asset = await publishQuestPage(
      QuestBuildRequestSchema.parse(storedQuest),
    );
    markQuestReady(storedQuest.id, asset);
    return Response.json({ success: true, asset });
  } catch {
    const asset = createLocalQuestAsset(quest.data.id, request.url);
    markQuestReady(quest.data.id, asset);
    return Response.json({ success: true, asset });
  }
}
