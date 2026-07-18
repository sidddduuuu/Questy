import type { Quest, ZeroQuestAsset } from "./quest.ts";

// ponytail: a global process-local store keeps separate Next.js route bundles
// in sync for this single-instance demo. Use shared persistence when scaling.
const processStore = globalThis as typeof globalThis & {
  questLoopQuests?: Map<string, Quest>;
};
const quests = processStore.questLoopQuests ?? new Map<string, Quest>();
processStore.questLoopQuests = quests;

export function saveQuest(quest: Quest): Quest {
  quests.set(quest.id, quest);
  return quest;
}

export function getQuest(questId: string): Quest | undefined {
  return quests.get(questId);
}

export function markQuestReady(
  questId: string,
  assets: ZeroQuestAsset[],
): Quest | undefined {
  const quest = quests.get(questId);
  if (!quest) return undefined;

  const readyQuest: Quest = {
    ...quest,
    assets: [...quest.assets, ...assets],
    status: "ready",
  };
  quests.set(questId, readyQuest);
  return readyQuest;
}

export function markQuestCompleted(
  questId: string,
  completedAt: string,
): Quest | undefined {
  const quest = quests.get(questId);
  if (!quest || quest.status === "completed") return undefined;

  const completedQuest: Quest = {
    ...quest,
    status: "completed",
    completedAt,
  };
  quests.set(questId, completedQuest);
  return completedQuest;
}
