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
  "Load customer context from Nexla",
  "Select a quest strategy",
  "Determine required capabilities",
  "Search Zero for a service",
  "Generate image and live form",
  "Publish the live campaign",
] as const;

type AppState =
  | "customer_loaded"
  | "quest_planning"
  | "zero_searching"
  | "quest_ready"
  | "quest_completed"
  | "promoted"
  | "error";
type Screen = "dashboard" | "compare" | "quest" | "promotion";
type PersonaLabels = Record<CustomerContext["persona"], string>;
type ContextSource = "nexla" | "nexla-cache";
type QuestVerification = {
  postPublished: boolean;
  imagePublished: boolean;
  formShared: boolean;
};
type CustomerRun = {
  quest: Quest;
  planner: QuestPlannerExecution;
  asset: ZeroQuestAsset;
  completion: QuestCompletion | null;
  source: ContextSource;
  durationMs: number;
};

async function responseJson(response: Response): Promise<unknown> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = ApiErrorSchema.safeParse(body);
    throw new Error(error.success ? error.data.error : "The request failed");
  }
  return body;
}

function SourceBadge({ source }: { source: ContextSource }) {
  return (
    <span className="source-badge" data-source={source}>
      <span aria-hidden="true" />
      {source === "nexla" ? "Nexla live" : "Nexla recovery"}
    </span>
  );
}

function CustomerAvatar({ customer }: { customer: CustomerContext }) {
  return (
    <span className={`avatar avatar-${customer.id}`} aria-hidden="true">
      {customer.name[0]}
    </span>
  );
}

function TopNav({ screen, onChange }: { screen: Screen; onChange: (screen: Screen) => void }) {
  const items: Array<{ id: Screen; icon: string; label: string }> = [
    { id: "dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
    { id: "compare", icon: "ti-arrows-diff", label: "Compare" },
    { id: "quest", icon: "ti-sparkles", label: "Quest page" },
    { id: "promotion", icon: "ti-trophy", label: "Promotion" },
  ];

  return (
    <header className="topbar">
      <button className="wordmark" onClick={() => onChange("dashboard")} type="button">
        <span className="wordmark-mark" aria-hidden="true">Q</span>
        QuestLoop
      </button>
      <nav aria-label="Demo screens">
        {items.map((item) => (
          <button
            aria-current={screen === item.id ? "page" : undefined}
            key={item.id}
            onClick={() => onChange(item.id)}
            type="button"
          >
            <i className={`ti ${item.icon}`} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </nav>
      <span className="live-pill"><span aria-hidden="true" /> Live integrations</span>
    </header>
  );
}

function Sidebar({
  customers,
  selected,
  busy,
  personaLabels,
  onSelect,
  onRunDemo,
}: {
  customers: CustomerContext[];
  selected: CustomerContext;
  busy: boolean;
  personaLabels: PersonaLabels;
  onSelect: (id: CustomerId) => void;
  onRunDemo: () => void;
}) {
  return (
    <aside className="sidebar">
      <div className="goal-label">Business goal</div>
      <p className="goal-copy">{BUSINESS_GOAL}.</p>
      <div className="side-heading">
        <span>Customers</span>
        <small>{customers.length} live records</small>
      </div>
      <div className="customer-list">
        {customers.map((customer) => (
          <button
            aria-pressed={customer.id === selected.id}
            className="customer-button"
            disabled={busy}
            key={customer.id}
            onClick={() => onSelect(customer.id)}
            type="button"
          >
            <CustomerAvatar customer={customer} />
            <span className="customer-copy">
              <strong>{customer.name}</strong>
              <small>{personaLabels[customer.persona]}</small>
            </span>
            <span className="xp-mini">{customer.currentXp.toLocaleString()} XP</span>
          </button>
        ))}
      </div>
      <button className="run-demo" disabled={busy} onClick={onRunDemo} type="button">
        <i className="ti ti-player-play-filled" aria-hidden="true" />
        {busy ? "Running live flow…" : "Run full demo"}
      </button>
      <p className="side-note">Uses Maya’s live record and has Zero create her complete social campaign.</p>
    </aside>
  );
}

function Trace({ progress, phase, source }: { progress: number; phase: AppState; source: ContextSource }) {
  const busy = phase === "quest_planning" || phase === "zero_searching";
  return (
    <ol className="agent-trace" aria-label="Live agent trace" aria-live="polite">
      {traceSteps.map((step, index) => {
        const status = index < progress
          ? "done"
          : index === progress && busy
            ? "active"
            : index === progress && phase === "error"
              ? "failed"
              : "queued";
        const label = index === 0 && source === "nexla-cache" ? "Load cached Nexla context" : step;
        return (
          <li className={status} key={step}>
            <span className="trace-icon" aria-hidden="true">
              <i className={`ti ${status === "done" ? "ti-check" : status === "failed" ? "ti-x" : "ti-point"}`} />
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function IntegrationProof({ planner, asset, durationMs }: { planner: QuestPlannerExecution | null; asset: ZeroQuestAsset | null; durationMs: number | null }) {
  if (!planner && !asset) return null;
  return (
    <div className="integration-proof">
      {planner && (
        <div>
          <span>AI planning</span>
          <strong>{planner.provider}</strong>
          <small>{planner.status === "created" ? `Run ${planner.runId.slice(0, 10)}` : "Recovery plan"}</small>
        </div>
      )}
      {asset && (
        <div>
          <span>Quest hosting</span>
          <strong>{asset.provider ?? "Zero capability"}</strong>
          <small>{asset.status === "created" ? "Published live" : "Local recovery"}</small>
        </div>
      )}
      <div>
        <span>Live execution</span>
        <strong>{durationMs === null ? "In progress" : `${(durationMs / 1_000).toFixed(1)} seconds`}</strong>
        <small>{asset?.cost === undefined ? "Cost recorded by Zero" : `$${asset.cost.toFixed(3)} recorded cost`}</small>
      </div>
    </div>
  );
}

function QuestCard({
  quest,
  asset,
  completion,
  completing,
  onComplete,
}: {
  quest: Quest;
  asset: ZeroQuestAsset | null;
  completion: QuestCompletion | null;
  completing: boolean;
  onComplete: (verification: QuestVerification) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [verification, setVerification] = useState<QuestVerification>({
    postPublished: false,
    imagePublished: false,
    formShared: false,
  });
  const image = quest.assets.find(({ assetType }) => assetType === "image");
  const form = quest.assets.find(({ assetType }) => assetType === "form");
  const verified = Object.values(verification).every(Boolean);

  function updateVerification(key: keyof QuestVerification, checked: boolean) {
    setVerification((current) => ({ ...current, [key]: checked }));
  }

  function copyPost() {
    void navigator.clipboard.writeText(quest.socialPost)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  }

  return (
    <article className="quest-card">
      <div className="quest-card-top">
        <span className="quest-tag"><i className="ti ti-bolt" aria-hidden="true" /> Personalized quest</span>
        <span className="quest-status"><span aria-hidden="true" /> {quest.status === "completed" ? "Completed" : "Ready"}</span>
      </div>
      <h2>{quest.title}</h2>
      <p className="quest-description">{quest.description}</p>
      <div className="reward-row">
        <span><i className="ti ti-star-filled" aria-hidden="true" /> +{quest.xpReward} XP</span>
        <span><i className="ti ti-gift" aria-hidden="true" /> {quest.businessReward}</span>
      </div>
      <p className="rationale"><strong>Why this fits:</strong> {quest.rationale}</p>
      <div className="capability-list" aria-label="Agent-selected capabilities">
        {quest.requiredCapabilities.map((capability) => <span key={capability}>{capability}</span>)}
      </div>
      {image?.url && form?.url && (
        <section className="campaign-kit" aria-label="Zero-created campaign toolkit">
          <div className="campaign-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="AI-generated restaurant campaign" src={image.url} />
            <a href={image.url} rel="noreferrer" target="_blank">Open image <i className="ti ti-arrow-up-right" aria-hidden="true" /></a>
          </div>
          <div className="campaign-copy">
            <span className="eyebrow">Ready-to-post caption</span>
            <p>{quest.socialPost}</p>
            <button className="button secondary-button" onClick={copyPost} type="button">
              <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} aria-hidden="true" />
              {copied ? "Copied" : "Copy post"}
            </button>
            <div className="form-proof">
              <strong>Customer form is live</strong>
              <span>{quest.dishChoices.join(" · ")}</span>
              <a href={form.url} rel="noreferrer" target="_blank">Open form <i className="ti ti-arrow-up-right" aria-hidden="true" /></a>
            </div>
          </div>
        </section>
      )}
      <p className="trust-line"><i className="ti ti-shield-lock" aria-hidden="true" /> Completion and XP awards are protected by Pomerium.</p>
      {asset && !completion && (
        <fieldset className="verification-list">
          <legend>Verify campaign completion</legend>
          <label><input checked={verification.postPublished} onChange={(event) => updateVerification("postPublished", event.target.checked)} type="checkbox" /> Post published</label>
          <label><input checked={verification.imagePublished} onChange={(event) => updateVerification("imagePublished", event.target.checked)} type="checkbox" /> Image shared</label>
          <label><input checked={verification.formShared} onChange={(event) => updateVerification("formShared", event.target.checked)} type="checkbox" /> Form link added</label>
        </fieldset>
      )}
      <div className="quest-actions">
        {asset?.url && (
          <a className="button secondary-button" href={asset.url} rel="noreferrer" target="_blank">
            <i className="ti ti-external-link" aria-hidden="true" /> Open live quest
          </a>
        )}
        {asset && !completion && (
          <button className="button primary-button" disabled={completing || !verified} onClick={() => onComplete(verification)} type="button">
            <i className={`ti ${completing ? "ti-loader-2" : "ti-rosette-discount-check"}`} aria-hidden="true" />
            {completing ? "Verifying with Pomerium…" : "Complete quest"}
          </button>
        )}
      </div>
    </article>
  );
}

function CustomerContextPanel({ customer, source }: { customer: CustomerContext; source: ContextSource }) {
  return (
    <section className="context-panel">
      <div className="section-title">
        <div>
          <span className="eyebrow">Normalized customer context</span>
          <h2>{customer.name}, understood</h2>
        </div>
        <SourceBadge source={source} />
      </div>
      <dl className="context-grid">
        <div><dt>Visit pattern</dt><dd>{customer.visitPattern}</dd></div>
        <div><dt>Sharing style</dt><dd>{customer.sharingStyle}</dd></div>
        <div><dt>Natural group</dt><dd>{customer.commonGroup}</dd></div>
        <div><dt>Favorite</dt><dd>{customer.favoriteProduct}</dd></div>
      </dl>
    </section>
  );
}

function Dashboard({
  customer,
  source,
  phase,
  traceProgress,
  quest,
  planner,
  asset,
  completion,
  completing,
  error,
  durationMs,
  onCreate,
  onComplete,
}: {
  customer: CustomerContext;
  source: ContextSource;
  phase: AppState;
  traceProgress: number;
  quest: Quest | null;
  planner: QuestPlannerExecution | null;
  asset: ZeroQuestAsset | null;
  completion: QuestCompletion | null;
  completing: boolean;
  error: string | null;
  durationMs: number | null;
  onCreate: () => void;
  onComplete: (verification: QuestVerification) => void;
}) {
  const busy = phase === "quest_planning" || phase === "zero_searching";
  return (
    <div className="dashboard-screen">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Live loyalty orchestration</span>
          <h1>One goal. A different quest for every customer.</h1>
          <p>Nexla supplies the context. Zero finds and runs the capabilities. Pomerium verifies who earns the reward.</p>
          <button className="button primary-button create-button" disabled={busy} onClick={onCreate} type="button">
            <i className={`ti ${busy ? "ti-loader-2" : "ti-sparkles"}`} aria-hidden="true" />
            {busy ? "Building with live services…" : quest ? "Build a new quest" : `Create ${customer.name}’s quest`}
          </button>
        </div>
        <div className="hero-customer">
          <CustomerAvatar customer={customer} />
          <div><small>Selected customer</small><strong>{customer.name}</strong><span>{customer.currentTier} · {customer.currentXp.toLocaleString()} XP</span></div>
        </div>
      </section>

      <div className="dashboard-grid">
        <CustomerContextPanel customer={customer} source={source} />
        <section className="trace-panel">
          <div className="section-title">
            <div><span className="eyebrow">Agent execution</span><h2>Live decision trace</h2></div>
            <span className={`phase-chip phase-${phase}`}>{busy ? "Running" : phase === "error" ? "Needs attention" : quest ? "Ready" : "Waiting"}</span>
          </div>
          <Trace phase={phase} progress={traceProgress} source={source} />
        </section>
      </div>

      {error && <p className="message error-message" role="alert"><i className="ti ti-alert-circle" aria-hidden="true" /> {error}</p>}
      {planner?.status === "fallback" && <p className="message recovery-message">Zero planning recovered with a validated local strategy.</p>}
      {asset?.status === "fallback" && <p className="message recovery-message">Zero hosting recovered to the built-in quest page.</p>}
      {quest && <QuestCard asset={asset} completion={completion} completing={completing} key={quest.id} onComplete={onComplete} quest={quest} />}
      <IntegrationProof asset={asset} durationMs={durationMs} planner={planner} />
    </div>
  );
}

function CompareScreen({
  customers,
  selected,
  personaLabels,
  runs,
  busy,
  onGenerate,
}: {
  customers: CustomerContext[];
  selected: CustomerContext;
  personaLabels: PersonaLabels;
  runs: Partial<Record<CustomerId, CustomerRun>>;
  busy: boolean;
  onGenerate: (id: CustomerId) => void;
}) {
  const generatedCount = Object.keys(runs).length;
  return (
    <section className="content-screen">
      <span className="eyebrow">Pitch proof · {generatedCount} of {customers.length} quests live</span>
      <h1>Same goal. Different quest mechanics.</h1>
      <p className="screen-intro">Every result below is generated from the customer’s real normalized context and published through the live build flow.</p>
      <div className="compare-grid">
        {customers.map((customer) => {
          const run = runs[customer.id];
          return (
            <article className="compare-card" data-selected={customer.id === selected.id} key={customer.id}>
              <CustomerAvatar customer={customer} />
              <span className="persona-label">{personaLabels[customer.persona]}</span>
              <h2>{customer.name}</h2>
              <p className="compare-context">{customer.sharingStyle} sharing · {customer.commonGroup}</p>
              {run ? (
                <div className="compare-quest">
                  <span className="quest-status"><span aria-hidden="true" /> {run.asset.status === "created" ? "Zero live" : "Recovery live"}</span>
                  <h3>{run.quest.title}</h3>
                  <p>{run.quest.description}</p>
                  <div className="reward-row"><span>+{run.quest.xpReward} XP</span><span>{run.quest.businessReward}</span></div>
                  {run.asset.url && <a className="compare-link" href={run.asset.url} rel="noreferrer" target="_blank">Open quest <i className="ti ti-arrow-up-right" aria-hidden="true" /></a>}
                </div>
              ) : (
                <div className="compare-empty">
                  <p>Generate this customer’s quest to add real evidence to the comparison.</p>
                  <button className="button secondary-button" disabled={busy} onClick={() => onGenerate(customer.id)} type="button">Generate {customer.name}’s quest</button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function QuestScreen({ quest, asset, customer }: { quest: Quest | null; asset: ZeroQuestAsset | null; customer: CustomerContext }) {
  const image = quest?.assets.find(({ assetType }) => assetType === "image");
  const form = quest?.assets.find(({ assetType }) => assetType === "form");
  return (
    <section className="content-screen quest-page-screen">
      <span className="eyebrow">Published experience</span>
      <h1>{quest ? `${customer.name}’s live quest` : "No quest published yet"}</h1>
      {quest && asset ? (
        <div className="published-card">
          <div className="published-art">
            {image?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Zero-generated restaurant social campaign" src={image.url} />
            ) : <i className="ti ti-map-pin-star" aria-hidden="true" />}
          </div>
          <div>
            <span className="quest-tag">Powered by {asset.provider ?? "Zero"}</span>
            <h2>{quest.title}</h2>
            <p>{quest.socialPost}</p>
            <div className="reward-row"><span>+{quest.xpReward} XP</span><span>{quest.businessReward}</span></div>
            <div className="quest-actions">
              {asset.url && <a className="button primary-button" href={asset.url} rel="noreferrer" target="_blank"><i className="ti ti-external-link" aria-hidden="true" /> Open campaign</a>}
              {form?.url && <a className="button secondary-button" href={form.url} rel="noreferrer" target="_blank"><i className="ti ti-forms" aria-hidden="true" /> Open customer form</a>}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state"><i className="ti ti-sparkles" aria-hidden="true" /><h2>Create a quest first</h2><p>Return to Dashboard and run the live flow. The Zero-hosted result will appear here.</p></div>
      )}
    </section>
  );
}

function PromotionScreen({ completion, customer }: { completion: QuestCompletion | null; customer: CustomerContext }) {
  return (
    <section className="content-screen promotion-screen">
      <span className="eyebrow">Authenticated reward</span>
      <h1>{completion ? (completion.promoted ? `${customer.name} reached ${completion.newTier}` : `${customer.name} earned ${completion.xpAwarded} XP`) : "Complete a quest to unlock promotion"}</h1>
      {completion ? (
        <div className="promotion-card">
          <span className="trophy" aria-hidden="true"><i className="ti ti-trophy-filled" /></span>
          <span className="verified"><i className="ti ti-shield-check-filled" aria-hidden="true" /> Identity verified by Pomerium</span>
          <div className="tier-change"><span>{completion.oldTier}</span><i className="ti ti-arrow-right" aria-hidden="true" /><strong>{completion.newTier}</strong></div>
          <progress max={Math.max(completion.totalXp, 2_000)} value={completion.totalXp}>{completion.totalXp} XP</progress>
          <p>{completion.totalXp.toLocaleString()} XP total · +{completion.xpAwarded} XP from this quest</p>
        </div>
      ) : (
        <div className="empty-state"><i className="ti ti-shield-lock" aria-hidden="true" /><h2>No completion recorded</h2><p>Complete the published quest while signed in. Pomerium verifies the allowed identity before XP is awarded.</p></div>
      )}
    </section>
  );
}

function XpFooter({ customer, completion }: { customer: CustomerContext; completion: QuestCompletion | null }) {
  const xp = completion?.totalXp ?? customer.currentXp;
  const nextTarget = xp < 500 ? 500 : xp < 1_000 ? 1_000 : xp < 2_000 ? 2_000 : xp;
  const percent = Math.min(100, Math.round((xp / nextTarget) * 100));
  return (
    <footer className="xp-footer">
      <span><strong>{customer.name}</strong> · {completion?.newTier ?? customer.currentTier}</span>
      <div className="xp-track"><span style={{ width: `${percent}%` }} /></div>
      <span>{xp.toLocaleString()} XP</span>
    </footer>
  );
}

export default function QuestDemo({
  customers,
  initialContextSource,
  personaLabels,
}: {
  customers: CustomerContext[];
  initialContextSource: ContextSource;
  personaLabels: PersonaLabels;
}) {
  const [selectedId, setSelectedId] = useState<CustomerId>(customers[0].id);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [phase, setPhase] = useState<AppState>("customer_loaded");
  const [traceProgress, setTraceProgress] = useState(1);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [planner, setPlanner] = useState<QuestPlannerExecution | null>(null);
  const [asset, setAsset] = useState<ZeroQuestAsset | null>(null);
  const [completion, setCompletion] = useState<QuestCompletion | null>(null);
  const [completing, setCompleting] = useState(false);
  const [contextSource, setContextSource] = useState(initialContextSource);
  const [error, setError] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [runs, setRuns] = useState<Partial<Record<CustomerId, CustomerRun>>>({});
  const selected = customers.find(({ id }) => id === selectedId) ?? customers[0];
  const busy = phase === "quest_planning" || phase === "zero_searching";

  function resetForCustomer(customerId: CustomerId) {
    setSelectedId(customerId);
    setPhase("customer_loaded");
    setTraceProgress(1);
    setQuest(null);
    setPlanner(null);
    setAsset(null);
    setCompletion(null);
    setCompleting(false);
    setError(null);
    setDurationMs(null);
  }

  function selectCustomer(customerId: CustomerId) {
    const run = runs[customerId];
    if (!run) {
      resetForCustomer(customerId);
    } else {
      setSelectedId(customerId);
      setPhase(run.completion ? (run.completion.promoted ? "promoted" : "quest_completed") : "quest_ready");
      setTraceProgress(traceSteps.length);
      setQuest(run.quest);
      setPlanner(run.planner);
      setAsset(run.asset);
      setCompletion(run.completion);
      setContextSource(run.source);
      setDurationMs(run.durationMs);
      setCompleting(false);
      setError(null);
    }
    setScreen("dashboard");
  }

  async function createQuest(customerId: CustomerId = selected.id) {
    const customer = customers.find(({ id }) => id === customerId) ?? selected;
    const startedAt = performance.now();
    resetForCustomer(customer.id);
    setScreen("dashboard");
    setPhase("quest_planning");

    try {
      const generated = GenerateQuestResponseSchema.parse(await responseJson(await fetch("/api/quests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, businessGoal: BUSINESS_GOAL }),
      })));
      setQuest(generated.quest);
      setPlanner(generated.planner);
      setContextSource(generated.source);
      setPhase("zero_searching");
      setTraceProgress(3);

      const built = BuildQuestResponseSchema.parse(await responseJson(await fetch(`/api/quests/${generated.quest.id}/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generated.quest),
      })));
      const pageAsset = built.assets.find(({ assetType }) => assetType === "page");
      if (!pageAsset) throw new Error("Zero did not return a published campaign page");
      const readyQuest: Quest = { ...generated.quest, assets: built.assets, status: "ready" };
      const elapsed = performance.now() - startedAt;
      setAsset(pageAsset);
      setQuest(readyQuest);
      setDurationMs(elapsed);
      setRuns((current) => ({
        ...current,
        [customer.id]: {
          quest: readyQuest,
          planner: generated.planner,
          asset: pageAsset,
          completion: null,
          source: generated.source,
          durationMs: elapsed,
        },
      }));
      setTraceProgress(traceSteps.length);
      setPhase("quest_ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Quest creation failed");
      setPhase("error");
    }
  }

  async function completeQuest(verification: QuestVerification) {
    if (!quest) return;
    setError(null);
    setCompleting(true);
    try {
      const result = CompleteQuestResponseSchema.parse(await responseJson(await fetch(`/api/quests/${quest.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verification),
      })));
      const completedQuest: Quest = { ...quest, status: "completed", completedAt: new Date().toISOString() };
      setCompletion(result);
      setQuest(completedQuest);
      setRuns((current) => {
        const run = current[quest.customerId];
        return run ? { ...current, [quest.customerId]: { ...run, quest: completedQuest, completion: result } } : current;
      });
      setPhase(result.promoted ? "promoted" : "quest_completed");
      setScreen("promotion");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Quest completion failed");
      setScreen("dashboard");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="app-shell">
      <TopNav onChange={setScreen} screen={screen} />
      <Sidebar busy={busy} customers={customers} onRunDemo={() => void createQuest("maya")} onSelect={selectCustomer} personaLabels={personaLabels} selected={selected} />
      <main className="main-content">
        {screen === "dashboard" && <Dashboard asset={asset} completing={completing} completion={completion} customer={selected} durationMs={durationMs} error={error} onComplete={(verification) => void completeQuest(verification)} onCreate={() => void createQuest()} phase={phase} planner={planner} quest={quest} source={contextSource} traceProgress={traceProgress} />}
        {screen === "compare" && <CompareScreen busy={busy} customers={customers} onGenerate={(id) => void createQuest(id)} personaLabels={personaLabels} runs={runs} selected={selected} />}
        {screen === "quest" && <QuestScreen asset={asset} customer={selected} quest={quest} />}
        {screen === "promotion" && <PromotionScreen completion={completion} customer={selected} />}
      </main>
      <XpFooter completion={completion} customer={selected} />
    </div>
  );
}
