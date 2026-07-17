"use client";

import { useState } from "react";
import type { CustomerContext, CustomerId } from "@/lib/customer";
import {
  ApiErrorSchema,
  BuildQuestResponseSchema,
  CompleteQuestResponseSchema,
  GenerateQuestResponseSchema,
  type Quest,
  type QuestCompletion,
  type QuestPlannerExecution,
  type ZeroQuestAsset,
} from "@/lib/quest";

const BUSINESS_GOAL = "Fill quiet Tuesday afternoons with new customers";

const traceSteps = [
  "Understanding customer with Nexla...",
  "Selecting quest strategy...",
  "Determining required capabilities...",
  "Searching Zero.xyz...",
  "Executing selected service...",
  "Publishing quest...",
  "Quest is live.",
] as const;

type AppState =
  | "customer_loaded"
  | "quest_planning"
  | "zero_searching"
  | "quest_ready"
  | "quest_completed"
  | "promoted"
  | "error";

type PersonaLabels = Record<CustomerContext["persona"], string>;

async function responseJson(response: Response): Promise<unknown> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = ApiErrorSchema.safeParse(body);
    throw new Error(error.success ? error.data.error : "The request failed");
  }
  return body;
}

export default function QuestDemo({
  customers,
  personaLabels,
}: {
  customers: CustomerContext[];
  personaLabels: PersonaLabels;
}) {
  const [selectedId, setSelectedId] = useState<CustomerId>(customers[0].id);
  const [phase, setPhase] = useState<AppState>("customer_loaded");
  const [traceProgress, setTraceProgress] = useState(1);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [planner, setPlanner] = useState<QuestPlannerExecution | null>(null);
  const [asset, setAsset] = useState<ZeroQuestAsset | null>(null);
  const [completion, setCompletion] = useState<QuestCompletion | null>(null);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = customers.find(({ id }) => id === selectedId) ?? customers[0];
  const busy = phase === "quest_planning" || phase === "zero_searching";

  function selectCustomer(customerId: CustomerId) {
    setSelectedId(customerId);
    setPhase("customer_loaded");
    setTraceProgress(1);
    setQuest(null);
    setPlanner(null);
    setAsset(null);
    setCompletion(null);
    setCompleting(false);
    setError(null);
  }

  async function createQuest() {
    setError(null);
    setQuest(null);
    setPlanner(null);
    setAsset(null);
    setCompletion(null);
    setPhase("quest_planning");
    setTraceProgress(1);

    try {
      const generated = GenerateQuestResponseSchema.parse(
        await responseJson(
          await fetch("/api/quests/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerId: selected.id, businessGoal: BUSINESS_GOAL }),
          }),
        ),
      );
      setQuest(generated.quest);
      setPlanner(generated.planner);
      setPhase("zero_searching");
      setTraceProgress(3);

      const built = BuildQuestResponseSchema.parse(
        await responseJson(
          await fetch(`/api/quests/${generated.quest.id}/build`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(generated.quest),
          }),
        ),
      );
      setAsset(built.asset);
      setQuest({
        ...generated.quest,
        assets: [...generated.quest.assets, built.asset],
        status: "ready",
      });
      setTraceProgress(traceSteps.length);
      setPhase("quest_ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Quest creation failed");
      setPhase("error");
    }
  }

  async function completeQuest() {
    if (!quest) return;
    setError(null);
    setCompleting(true);

    try {
      const result = CompleteQuestResponseSchema.parse(
        await responseJson(
          await fetch(`/api/quests/${quest.id}/complete`, { method: "POST" }),
        ),
      );
      setCompletion(result);
      setQuest({ ...quest, status: "completed", completedAt: new Date().toISOString() });
      setPhase(result.promoted ? "promoted" : "quest_completed");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Quest completion failed");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <main>
      <header className="masthead">
        <div>
          <span className="brand">QuestLoop</span>
          <h1>One goal. A different quest for every customer.</h1>
        </div>
        <div className="goal-block">
          <span>Business goal</span>
          <strong>{BUSINESS_GOAL}.</strong>
        </div>
      </header>

      <div className="demo-grid">
        <aside aria-labelledby="customers-heading">
          <div className="panel-heading">
            <div>
              <span className="step-label">1 · Customer</span>
              <h2 id="customers-heading">Choose a customer</h2>
            </div>
            <span className="connection"><i aria-hidden="true" /> Nexla live</span>
          </div>

          <div className="customer-list">
            {customers.map((customer) => (
              <button
                className="customer-option"
                aria-pressed={customer.id === selected.id}
                disabled={busy}
                key={customer.id}
                onClick={() => selectCustomer(customer.id)}
                type="button"
              >
                <span className="initial" aria-hidden="true">{customer.name[0]}</span>
                <span><strong>{customer.name}</strong><small>{personaLabels[customer.persona]}</small></span>
                <b>{customer.currentXp.toLocaleString()} XP</b>
              </button>
            ))}
          </div>

          <section className="context" aria-label={`${selected.name} Nexla context`}>
            <div className="context-title"><strong>Nexla customer context</strong><span>Normalized</span></div>
            <dl>
              <div><dt>Visit pattern</dt><dd>{selected.visitPattern}</dd></div>
              <div><dt>Sharing style</dt><dd>{selected.sharingStyle}</dd></div>
              <div><dt>Natural group</dt><dd>{selected.commonGroup}</dd></div>
              <div><dt>Favorite</dt><dd>{selected.favoriteProduct}</dd></div>
              <div><dt>Tier</dt><dd>{selected.currentTier}</dd></div>
            </dl>
          </section>
        </aside>

        <section className="quest-workspace" aria-busy={busy} aria-labelledby="quest-heading">
          <div className="panel-heading">
            <div>
              <span className="step-label">2 · Personalized quest</span>
              <h2 id="quest-heading">{quest ? quest.title : `Build ${selected.name}’s next quest`}</h2>
            </div>
            {planner && <span className="run-chip">Zero run {planner.runId.slice(0, 8)}</span>}
          </div>

          <ol className="trace" aria-label="Quest creation trace" aria-live="polite">
            {traceSteps.map((step, index) => {
              const status = index < traceProgress
                ? "done"
                : index === traceProgress && busy
                  ? "active"
                  : index === traceProgress && phase === "error"
                    ? "failed"
                    : "queued";
              return <li className={status} key={step}><i aria-hidden="true" /><span>{step}</span></li>;
            })}
          </ol>

          {error && <p className="error-message" role="alert">{error}</p>}
          {asset?.status === "fallback" && (
            <p className="fallback-message" role="status">
              Primary hosting service failed — QuestLoop selected its local recovery page.
            </p>
          )}

          {!quest && (
            <div className="empty-quest">
              <p>The agent will use {selected.name}’s live context to invent the quest, then acquire the playable experience through Zero.</p>
              <button className="primary" disabled={busy} onClick={createQuest} type="button">
                {busy ? "Creating quest…" : "Create personalized quest"}
              </button>
            </div>
          )}

          {quest && (
            <article className="quest-result">
              <p className="quest-description">{quest.description}</p>
              <div className="rewards"><strong>+{quest.xpReward} XP</strong><span>{quest.businessReward}</span></div>
              <p className="rationale">{quest.rationale}</p>

              <div className="capabilities">
                <span>Agent-selected capabilities</span>
                <ul>{quest.requiredCapabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul>
              </div>

              {asset && (
                <div className="asset-proof">
                  <div><span>{asset.status === "fallback" ? "Recovered by" : "Created by Zero"}</span><strong>{asset.provider ?? "Zero capability"}</strong></div>
                  <div><span>Run ID</span><strong>{asset.runId?.slice(0, 12) ?? "Recorded"}</strong></div>
                  <div><span>Cost</span><strong>{asset.cost === undefined ? "Recorded" : `$${asset.cost.toFixed(3)}`}</strong></div>
                </div>
              )}

              <div className="quest-actions">
                {asset?.url && <a className="secondary" href={asset.url} rel="noreferrer" target="_blank">Open live quest</a>}
                {asset && !completion && (
                  <button className="primary" disabled={completing} onClick={completeQuest} type="button">
                    {completing ? "Verifying identity…" : "Complete quest"}
                  </button>
                )}
                {phase === "error" && <button className="secondary" onClick={createQuest} type="button">Try again</button>}
              </div>
            </article>
          )}

          {completion && (
            <section className="completion" aria-live="polite">
              <span>Identity verified by Pomerium</span>
              <strong>{completion.promoted ? `${selected.name} reached ${completion.newTier}` : `+${completion.xpAwarded} XP awarded`}</strong>
              <progress max={Math.max(completion.totalXp, 2_000)} value={completion.totalXp}>
                {completion.totalXp} XP
              </progress>
              <small>{completion.totalXp.toLocaleString()} XP total</small>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
