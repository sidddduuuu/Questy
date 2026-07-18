import type { QuestBuildRequest } from "./quest.ts";

export function buildQuestFormRequest(
  quest: QuestBuildRequest,
  recipient: string,
) {
  if (quest.customerId === "omar") {
    return {
      title: `${quest.title} · Coworker lunch RSVP`,
      schema: {
        type: "object",
        required: ["name", "time", "mealChoice"],
        properties: {
          name: { type: "string", title: "Your name", minLength: 1 },
          time: {
            type: "string",
            title: "Preferred Tuesday time",
            enum: ["1:30 PM", "2:00 PM", "2:30 PM"],
          },
          mealChoice: {
            type: "string",
            title: "Lunch choice",
            enum: quest.dishChoices,
          },
          dietaryNeeds: {
            type: "string",
            title: "Dietary needs (optional)",
          },
        },
      },
      uiSchema: {
        time: { "ui:widget": "radio" },
        mealChoice: { "ui:widget": "radio" },
        dietaryNeeds: { "ui:widget": "textarea" },
      },
      recipients: [recipient],
    };
  }

  return {
    title: `${quest.title} · Choose Tuesday's favorite`,
    schema: {
      type: "object",
      required: ["name", "choice"],
      properties: {
        name: { type: "string", title: "Your name", minLength: 1 },
        choice: {
          type: "string",
          title: "What should we feature?",
          enum: quest.dishChoices,
        },
      },
    },
    uiSchema: { choice: { "ui:widget": "radio" } },
    recipients: [recipient],
  };
}
