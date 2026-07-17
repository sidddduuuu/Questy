import type { Metadata } from "next";
import { getAllCustomerContexts } from "@/lib/nexla";
import QuestDemo from "@/app/QuestDemo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Demo · QuestLoop",
  description: "Build a personalized loyalty quest with live Nexla, Zero, and Pomerium integrations.",
};

const personaLabels = {
  social_creator: "Social creator",
  office_connector: "Office connector",
  community_organizer: "Community organizer",
} as const;

async function loadCustomers() {
  try {
    return await getAllCustomerContexts();
  } catch {
    return null;
  }
}

export default async function DemoPage() {
  const result = await loadCustomers();

  if (!result || result.customers.length === 0) {
    return (
      <main className="integration-error">
        <span className="eyebrow">QuestLoop</span>
        <h1>Live customer context is unavailable.</h1>
        <p>Nexla did not return validated customer data. No mock data was substituted.</p>
      </main>
    );
  }

  return <QuestDemo customers={result.customers} initialContextSource={result.source} personaLabels={personaLabels} />;
}
