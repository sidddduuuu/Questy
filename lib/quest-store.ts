import type { Quest, ZeroQuestAsset } from "./quest.ts";

// ponytail: process-local storage is enough for the single-instance demo; use
// shared persistence when the app runs on multiple instances.
const quests = new Map<string, Quest>();

export function saveQuest(quest: Quest): Quest {
  quests.set(quest.id, quest);
  return quest;
}

export function getQuest(questId: string): Quest | undefined {
  return quests.get(questId);
}

export function markQuestReady(
  questId: string,
  asset: ZeroQuestAsset,
): Quest | undefined {
  const quest = quests.get(questId);
  if (!quest) return undefined;

  const readyQuest: Quest = {
    ...quest,
    assets: [...quest.assets, asset],
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
