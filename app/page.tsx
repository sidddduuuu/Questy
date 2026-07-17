import type { Metadata } from "next";
import Link from "next/link";
import styles from "./Landing.module.css";

export const metadata: Metadata = {
  title: "QuestLoop — Loyalty quests that build themselves",
  description: "Turn one business goal into a personalized, playable loyalty quest for every customer.",
};

const steps = [
  {
    title: "Understand the customer",
    body: "Nexla normalizes behavior, loyalty history, sharing style, and the active business goal into one trusted context.",
  },
  {
    title: "Invent the right quest",
    body: "The agent matches the objective to how that customer naturally influences friends, coworkers, or communities.",
  },
  {
    title: "Build it at runtime",
    body: "Zero discovers and executes the capabilities needed to publish the experience. Pomerium protects completion and XP.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main">Skip to content</a>

      <header className={styles.header}>
        <Link className={styles.logo} href="/" aria-label="QuestLoop home">
          <span aria-hidden="true">Q</span>
          QuestLoop
        </Link>
        <nav aria-label="Landing page">
          <a href="#why">Why QuestLoop</a>
          <a href="#how">How it works</a>
          <a href="#integrations">Integrations</a>
        </nav>
        <Link className={styles.headerCta} href="/demo">Launch live demo <i className="ti ti-arrow-up-right" aria-hidden="true" /></Link>
      </header>

      <main id="main">
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}><span aria-hidden="true" /> AI-native loyalty orchestration</p>
            <h1>Loyalty quests that build themselves.</h1>
            <p className={styles.heroText}>Give QuestLoop one business goal. It understands each customer, invents the right referral challenge, and launches a playable experience on demand.</p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryCta} href="/demo">Launch the live demo <i className="ti ti-player-play-filled" aria-hidden="true" /></Link>
              <a className={styles.secondaryCta} href="#how">See how it works <i className="ti ti-arrow-down" aria-hidden="true" /></a>
            </div>
            <p className={styles.heroNote}>Real customer context. Real capability execution. Authenticated rewards.</p>
          </div>

          <div className={styles.productStage} aria-label="Live QuestLoop product preview">
            <div className={styles.browserBar} aria-hidden="true">
              <span /><span /><span />
              <small>questloop.app/demo</small>
              <b>Live</b>
            </div>
            <div className={styles.previewViewport}>
              <iframe src="/demo" title="QuestLoop live product preview" tabIndex={-1} />
            </div>
            <div className={styles.proofFlag}><i className="ti ti-sparkles" aria-hidden="true" /><span><strong>Built live</strong>Not a campaign template</span></div>
          </div>
        </section>

        <div className={styles.partnerStrip} aria-label="Technology partners">
          <span>Context by <strong>Nexla</strong></span>
          <span>Capabilities by <strong>Zero</strong></span>
          <span>Identity by <strong>Pomerium</strong></span>
        </div>

        <section className={styles.why} id="why">
          <div className={styles.sectionLead}>
            <p>The problem with loyalty</p>
            <h2>Your customers are different. Their referral task should be too.</h2>
          </div>
          <div className={styles.contrast}>
            <div className={styles.oldWay}>
              <span>Traditional program</span>
              <blockquote>“Invite three friends and earn $10.”</blockquote>
              <p>One generic action, regardless of how a customer actually influences people.</p>
            </div>
            <div className={styles.newWay}>
              <span>QuestLoop</span>
              <div className={styles.personaRow}><b>Maya</b><p>Runs a public drink poll for friends and followers.</p><small>Social creator</small></div>
              <div className={styles.personaRow}><b>Omar</b><p>Invites coworkers to a private Tuesday lunch.</p><small>Office connector</small></div>
              <div className={styles.personaRow}><b>Lena</b><p>Hosts a small tasting for local parents.</p><small>Community organizer</small></div>
            </div>
          </div>
        </section>

        <section className={styles.how} id="how">
          <div className={styles.howIntro}>
            <p>From objective to experience</p>
            <h2>The quest does not exist until the agent builds it.</h2>
            <p>QuestLoop personalizes the action, difficulty, referral mechanism, experience, and reward—not just the message around a fixed campaign.</p>
          </div>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span>0{index + 1}</span>
                <div><h3>{step.title}</h3><p>{step.body}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.integrations} id="integrations">
          <div className={styles.integrationIntro}>
            <p>Three systems. One accountable flow.</p>
            <h2>Open-ended creation, grounded by real context and identity.</h2>
          </div>
          <div className={styles.integrationRoles}>
            <article><span className={styles.nexlaMark}>N</span><div><h3>Nexla understands</h3><p>Normalized customer behavior and the current business objective enter the planning flow through a validated schema.</p></div></article>
            <article><span className={styles.zeroMark}>Z</span><div><h3>Zero builds</h3><p>The agent discovers, inspects, executes, and reviews the capabilities needed to launch each quest at runtime.</p></div></article>
            <article><span className={styles.pomeriumMark}>P</span><div><h3>Pomerium protects</h3><p>A signed identity assertion guards quest completion so XP is awarded only across the trusted boundary.</p></div></article>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div>
            <p>One goal. A different playable quest for every customer.</p>
            <h2>See the full system run live.</h2>
          </div>
          <Link href="/demo">Launch QuestLoop <i className="ti ti-arrow-right" aria-hidden="true" /></Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <Link className={styles.logo} href="/"><span aria-hidden="true">Q</span>QuestLoop</Link>
        <p>Personalized loyalty, built at runtime.</p>
        <Link href="/demo">Open demo</Link>
      </footer>
    </div>
  );
}
