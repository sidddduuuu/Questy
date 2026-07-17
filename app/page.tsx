import { getAllCustomerContexts } from "@/lib/nexla";

export const dynamic = "force-dynamic";

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

export default async function Home() {
  const customers = await loadCustomers();

  if (!customers) {
    return (
      <main className="integration-error">
        <span className="eyebrow">QuestLoop</span>
        <h1>Live customer context is unavailable.</h1>
        <p>Nexla did not return validated customer data. No mock data was substituted.</p>
      </main>
    );
  }

  return (
    <main>
      <header>
        <span className="eyebrow">QuestLoop</span>
        <h1>One goal. A different quest for every customer.</h1>
        <p className="goal">Fill quiet Tuesday afternoons with new customers.</p>
      </header>

      <section aria-labelledby="customers-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Live customer context</span>
            <h2 id="customers-heading">Choose who you want to activate</h2>
          </div>
          <span className="source"><i aria-hidden="true" /> Nexla connected</span>
        </div>

        <div className="customer-grid">
          {customers.map((customer) => (
            <article key={customer.id}>
              <span className="initial" aria-hidden="true">{customer.name[0]}</span>
              <div>
                <h3>{customer.name}</h3>
                <p>{personaLabels[customer.persona]}</p>
              </div>
              <dl>
                <div><dt>Shares with</dt><dd>{customer.commonGroup}</dd></div>
                <div><dt>Favorite</dt><dd>{customer.favoriteProduct}</dd></div>
                <div><dt>Current XP</dt><dd>{customer.currentXp.toLocaleString()}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
