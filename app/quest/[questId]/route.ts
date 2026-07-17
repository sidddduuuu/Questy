import { QuestBuildRequestSchema, QuestIdSchema } from "@/lib/quest";
import { renderQuestPage } from "@/lib/quest-page";
import { getQuest } from "@/lib/quest-store";

type RouteContext = { params: Promise<{ questId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const questId = QuestIdSchema.safeParse((await params).questId);
  const quest = questId.success ? getQuest(questId.data) : undefined;
  if (!quest) return new Response("Quest not found", { status: 404 });

  return new Response(renderQuestPage(QuestBuildRequestSchema.parse(quest)), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
