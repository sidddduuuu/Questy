import { QuestBuildRequestSchema } from "@/lib/quest";
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
    return Response.json({ success: true, asset: await publishQuestPage(quest.data) });
  } catch {
    return Response.json(
      { success: false, error: "Zero could not publish the quest page" },
      { status: 502 },
    );
  }
}
