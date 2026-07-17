# QuestLoop — Hackathon Build README

> **One business goal. A different playable referral quest for every customer.**

QuestLoop is a gamified loyalty and referral experience where an AI agent creates a personalized quest for each customer and uses **Zero.xyz** to build the digital tools required to complete that quest.

This README is the single source of truth for all three builders and all coding agents.

---

## 0. Read This First

### The one-sentence product

A business selects a customer and clicks **Create Quest**. The agent invents a personalized referral challenge, uses Zero.xyz to create the required experience on demand, and lets the customer earn XP when the quest is completed.

### The one wow moment

Use the same business objective for two different customers:

- Maya receives a public social poll quest.
- Omar receives a private coworker lunch quest.

The app does not only change the text. It creates a different **playable experience** for each person.

### The sponsor priority

1. **Zero.xyz — deep, real, visible integration**
2. **Nexla ADK — small but real customer-context integration**
3. **Pomerium — small but real identity/access-control integration**

If time becomes limited, protect the Zero flow first.

---

# 1. Problem

Traditional loyalty and referral programs give every customer the same action:

> Invite three friends and earn $10.

This fails because customers influence people differently.

- Some customers post publicly.
- Some invite coworkers privately.
- Some organize families or communities.
- Some prefer one-to-one recommendations.
- Some are strong organizers but weak content creators.

Businesses also have changing objectives:

- Fill quiet Tuesday afternoons.
- Promote a new product.
- Bring customers to a new location.
- Increase group bookings.
- Recover inactive customers.

Existing loyalty tools may personalize the reward or message, but they still select from a small library of campaigns designed by the business in advance.

The result is generic engagement, low participation, and repetitive campaigns.

---

# 2. Solution

QuestLoop turns loyalty into a personalized game.

The business provides one objective:

> Fill quiet Tuesday afternoons.

The agent reads a normalized customer profile and creates a quest that matches both:

1. What the business currently needs.
2. How that specific customer naturally influences others.

Examples:

### Maya — Social Creator

> Let your friends choose your Tuesday order. Bring one person who voted.

Generated experience:

- Live voting page
- Social graphic
- Trackable referral link

### Omar — Office Connector

> Bring two coworkers for lunch this Tuesday.

Generated experience:

- Private invitation page
- RSVP form
- QR code

### Lena — Community Organizer

> Host a four-person family tasting.

Generated experience:

- Event page
- Registration form
- Invitation card

After completing the quest, the customer earns XP and may move to a higher loyalty tier.

---

# 3. Product Thesis

Traditional loyalty programs personalize the reward.

QuestLoop personalizes:

- The action
- The difficulty
- The referral mechanism
- The generated digital experience
- The points
- The next quest

The key Zero-native thesis is:

> The quest does not need to exist before the customer receives it.

The agent first invents the quest. It then determines which capabilities are required and uses Zero.xyz to acquire them.

---

# 4. Bare MVP

The MVP is one responsive page with one clean demo flow.

## Required flow

1. Display one fixed business goal.
2. Display three customer cards.
3. Select a customer.
4. Load that customer’s normalized context.
5. Click **Create Personalized Quest**.
6. Show the agent choosing a quest.
7. Show Zero.xyz discovering and executing the required capability.
8. Display the generated playable quest.
9. Open the generated quest experience.
10. Simulate completion.
11. Award XP.
12. Show a tier-promotion animation.

## Required customers

- Maya — Social Creator
- Omar — Office Connector
- Lena — Community Organizer

## Required business goal

> Fill quiet Tuesday afternoons with new customers.

Keep this fixed until the core demo is stable.

---

# 5. Do Not Build

Do not build any of the following before the primary demo works:

- Full authentication system
- Full CRM
- Multi-tenant business accounts
- Payment processing
- Reward-store redemption
- Real customer onboarding
- Public leaderboards
- Mobile application
- Complex database schema
- Admin analytics dashboard
- Social-network integrations
- Real booking integrations
- Large quest library
- More than three customer personas
- More than one business objective
- Autonomous outbound messaging
- A general-purpose loyalty platform

The MVP is not a finished SaaS product.

It is a focused proof that Zero.xyz enables open-ended quest creation.

---

# 6. Sponsor Responsibilities

## 6.1 Zero.xyz — Deep Integration

### Role

Zero.xyz turns the generated quest idea into a usable experience.

The agent does not know in advance what every quest will require.

It may need:

- A hosted page
- A form
- A QR code
- A social image
- A poll
- An invitation
- A trackable link

The agent determines the required capabilities after creating the quest and searches Zero for suitable services.

### Required real Zero usage

Use at least one real Zero capability in the live demo.

Preferred order:

1. Create or publish a quest webpage
2. Generate a QR code
3. Generate an image or social card
4. Create a hosted form
5. Send an email

The strongest implementation is:

> Zero publishes a unique quest page for the selected customer.

### Visible Zero execution trace

The UI must visibly show:

```text
Understanding customer...
Selecting quest strategy...
Determining required capabilities...
Searching Zero.xyz...
Executing selected service...
Publishing quest...
Quest is live.
```

### Required output

The Zero integration should return:

```ts
type ZeroQuestAsset = {
  assetType: "page" | "form" | "qr" | "image" | "other";
  provider?: string;
  url?: string;
  runId?: string;
  cost?: number;
  status: "created" | "failed" | "fallback";
  raw?: unknown;
};
```

### Fallback behavior

The demo must never stop if a Zero service fails.

If a live call fails:

1. Record the failure.
2. Display “Primary service failed — selecting fallback.”
3. Use a local quest-page fallback.
4. Mark the asset as `fallback`.
5. Continue the demo.

The fallback should preserve the story:

> The agent encountered a blocker and recovered.

### Deep sponsor statement

> Zero.xyz converts QuestLoop from a fixed library of referral templates into an open-ended quest engine. The agent invents a referral mechanism, discovers the required services, and launches it at runtime.

---

## 6.2 Nexla ADK — Customer Context

### Role

Nexla provides one normalized customer context to the quest agent.

The raw data can come from simple mock sources:

- Customer profile JSON
- Purchases CSV
- Visit history JSON
- Quest history JSON
- Business-goal JSON

Nexla’s role is to normalize this into a single shape.

### Required context schema

```ts
type CustomerContext = {
  id: string;
  name: string;
  persona:
    | "social_creator"
    | "office_connector"
    | "community_organizer";
  visitPattern: string;
  sharingStyle: "public" | "private" | "group";
  commonGroup: string;
  favoriteProduct: string;
  currentXp: number;
  currentTier: "Explorer" | "Connector" | "Organizer" | "Ambassador";
  previousQuestResult?: "completed" | "ignored" | "failed";
  businessGoal: string;
};
```

### Visible Nexla moment

When a customer is selected, show:

```text
Nexla customer context
✓ Purchases normalized
✓ Visit pattern detected
✓ Sharing style detected
✓ Current tier loaded
```

### Minimum acceptable integration

If a full pipeline is too slow, use Nexla ADK to ingest or transform one real customer-context payload.

Do not pretend static frontend JSON is a deep Nexla integration. At minimum:

- Call a Nexla-backed endpoint, or
- Use Nexla ADK in the orchestration process, or
- Show a real transformed payload produced through Nexla.

### Sponsor statement

> Nexla tells the agent who the customer is and what the business needs right now.

---

## 6.3 Pomerium — Trust Boundary

### Role

Pomerium protects one meaningful boundary.

Use it for one of these:

1. Protect the admin quest-generation route.
2. Protect the customer quest URL.
3. Protect the quest-completion endpoint.
4. Ensure one customer cannot access another customer’s private quest.

### Recommended MVP boundary

Protect:

```text
/api/quests/:questId/complete
```

Only an authorized customer or business admin should be able to mark a quest completed and award points.

### Visible Pomerium moment

Show a badge on the quest:

```text
Identity verified by Pomerium
```

Optional demo:

- Open Omar’s quest as Omar: allowed.
- Attempt to open Maya’s quest using Omar’s identity: denied.

### Minimum acceptable integration

A real Pomerium-protected route or endpoint must exist.

Do not spend most of the build time creating a complicated access model.

### Sponsor statement

> Pomerium ensures the right customer completes the right quest and receives the correct reward.

---

# 7. User Experience

## Main page layout

```text
┌──────────────────────────────────────────────────────────────┐
│ QUESTLOOP                                                    │
│ One goal. A different quest for every customer.              │
├──────────────────────────────────────────────────────────────┤
│ BUSINESS GOAL                                                │
│ Fill quiet Tuesday afternoons with new customers             │
├───────────────────────┬──────────────────────────────────────┤
│ CUSTOMERS             │ PERSONALIZED QUEST                   │
│                       │                                      │
│ [Maya]                │ Omar's Quest                         │
│ [Omar] selected       │ Bring two coworkers Tuesday.         │
│ [Lena]                │                                      │
│                       │ +300 XP · 20% group discount          │
│                       │                                      │
│                       │ Zero created:                         │
│                       │ ✓ Private invitation page             │
│                       │ ✓ RSVP experience                     │
│                       │ ✓ QR code                             │
│                       │                                      │
│                       │ [Open Quest] [Complete Quest]          │
├───────────────────────┴──────────────────────────────────────┤
│ Omar · Connector · 780 / 1,000 XP                            │
└──────────────────────────────────────────────────────────────┘
```

## Main states

The UI needs only these states:

```ts
type AppState =
  | "idle"
  | "customer_loading"
  | "customer_loaded"
  | "quest_planning"
  | "zero_searching"
  | "asset_creating"
  | "quest_ready"
  | "quest_completed"
  | "promoted"
  | "error";
```

---

# 8. Demo Data

## Maya

```json
{
  "id": "maya",
  "name": "Maya",
  "persona": "social_creator",
  "visitPattern": "visits with friends on weekends",
  "sharingStyle": "public",
  "commonGroup": "friends and followers",
  "favoriteProduct": "seasonal drinks",
  "currentXp": 320,
  "currentTier": "Explorer",
  "previousQuestResult": "completed",
  "businessGoal": "Fill quiet Tuesday afternoons with new customers"
}
```

Expected quest:

```json
{
  "title": "Let your friends choose your Tuesday order",
  "description": "Create a live poll with three menu choices and bring one person who voted for the winner.",
  "xpReward": 180,
  "businessReward": "Free drink for both",
  "requiredCapabilities": [
    "hosted poll page",
    "social graphic",
    "trackable link"
  ]
}
```

## Omar

```json
{
  "id": "omar",
  "name": "Omar",
  "persona": "office_connector",
  "visitPattern": "weekday lunch",
  "sharingStyle": "private",
  "commonGroup": "coworkers",
  "favoriteProduct": "lunch combinations",
  "currentXp": 780,
  "currentTier": "Connector",
  "previousQuestResult": "completed",
  "businessGoal": "Fill quiet Tuesday afternoons with new customers"
}
```

Expected quest:

```json
{
  "title": "Bring two coworkers for Tuesday lunch",
  "description": "Invite two coworkers to a private group lunch between 1:30 PM and 3:00 PM.",
  "xpReward": 300,
  "businessReward": "20% group discount",
  "requiredCapabilities": [
    "private invitation page",
    "RSVP form",
    "QR code"
  ]
}
```

## Lena

```json
{
  "id": "lena",
  "name": "Lena",
  "persona": "community_organizer",
  "visitPattern": "weekend family visits",
  "sharingStyle": "group",
  "commonGroup": "local parents",
  "favoriteProduct": "family tasting menu",
  "currentXp": 1420,
  "currentTier": "Organizer",
  "previousQuestResult": "completed",
  "businessGoal": "Fill quiet Tuesday afternoons with new customers"
}
```

Expected quest:

```json
{
  "title": "Host a four-person Tuesday tasting",
  "description": "Invite three local parents to a guided tasting during the Tuesday afternoon window.",
  "xpReward": 650,
  "businessReward": "Host visits free",
  "requiredCapabilities": [
    "event page",
    "group registration form",
    "invitation card"
  ]
}
```

---

# 9. Quest Object

Use one stable shared type.

```ts
type Quest = {
  id: string;
  customerId: string;
  businessGoal: string;
  title: string;
  description: string;
  rationale: string;
  xpReward: number;
  businessReward: string;
  tier: "Explorer" | "Connector" | "Organizer" | "Ambassador";
  requiredCapabilities: string[];
  assets: ZeroQuestAsset[];
  status:
    | "draft"
    | "planning"
    | "building"
    | "ready"
    | "completed"
    | "failed";
  createdAt: string;
  completedAt?: string;
};
```

---

# 10. Quest Generation Prompt

Use a constrained prompt. Do not allow the model to return a long essay.

```text
You are the QuestLoop quest planner.

Create one personalized referral quest using the supplied customer context and business goal.

Rules:
- The quest must directly help the business goal.
- The action must match the customer's natural behavior.
- Do not ask the customer to use a channel they avoid.
- The quest must be completable within seven days.
- The quest must involve at least one new or returning customer.
- Return one quest only.
- Identify the digital capabilities required to make the quest playable.
- Keep the title under 10 words.
- Keep the description under 35 words.
- Never expose private customer data.
- Do not create illegal, deceptive, spammy, or coercive activity.

Return JSON only:

{
  "title": "",
  "description": "",
  "rationale": "",
  "xpReward": 0,
  "businessReward": "",
  "tier": "",
  "requiredCapabilities": []
}
```

---

# 11. Zero Orchestration Prompt

```text
You are the QuestLoop execution agent.

You have received a personalized referral quest and a list of required capabilities.

Your job:
1. Determine the minimum set of external services required.
2. Search Zero.xyz for appropriate transactional services.
3. Prefer services that are reliable, fast, and inexpensive.
4. Use a strict total budget.
5. Create one visible playable quest asset.
6. Return the created URL, provider, cost, run ID, and status.
7. If the first service fails, try one fallback service.
8. If both fail, return a local fallback request rather than stopping.

Do not create unrelated assets.
Do not make purchases beyond the configured budget.
Do not send messages without explicit approval.
Do not expose customer private data.
```

---

# 12. API Contracts

## Load customer context

```http
GET /api/customers/:customerId/context
```

Response:

```json
{
  "success": true,
  "source": "nexla",
  "context": {}
}
```

## Generate quest

```http
POST /api/quests/generate
Content-Type: application/json
```

Request:

```json
{
  "customerId": "omar",
  "businessGoal": "Fill quiet Tuesday afternoons with new customers"
}
```

Response:

```json
{
  "success": true,
  "quest": {}
}
```

## Build quest asset through Zero

```http
POST /api/quests/:questId/build
```

Response:

```json
{
  "success": true,
  "asset": {
    "assetType": "page",
    "provider": "selected-zero-service",
    "url": "https://...",
    "runId": "...",
    "cost": 0.05,
    "status": "created"
  }
}
```

## Complete quest

```http
POST /api/quests/:questId/complete
```

Response:

```json
{
  "success": true,
  "xpAwarded": 300,
  "oldTier": "Connector",
  "newTier": "Organizer",
  "promoted": true
}
```

This endpoint should be protected by Pomerium.

---

# 13. Recommended Technical Stack

Keep the stack small.

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Framer Motion only if already installed
- One page
- Local state or a small store

## Backend

Use Next.js route handlers unless an existing backend is already available.

## Persistence

Use one of:

1. In-memory store for the demo
2. JSON files
3. SQLite
4. Supabase only if already configured

Do not introduce a new database unless required.

## AI

Use GPT-5.6 through the environment already available to the team.

The model generates a structured quest object only.

---

# 14. Suggested Folder Structure

```text
questloop/
├── app/
│   ├── page.tsx
│   ├── quest/
│   │   └── [questId]/
│   │       └── page.tsx
│   └── api/
│       ├── customers/
│       │   └── [customerId]/
│       │       └── context/
│       │           └── route.ts
│       └── quests/
│           ├── generate/
│           │   └── route.ts
│           └── [questId]/
│               ├── build/
│               │   └── route.ts
│               └── complete/
│                   └── route.ts
├── components/
│   ├── BusinessGoal.tsx
│   ├── CustomerCard.tsx
│   ├── CustomerContextPanel.tsx
│   ├── QuestGenerationTrace.tsx
│   ├── QuestCard.tsx
│   ├── ZeroAssetCard.tsx
│   ├── XpProgress.tsx
│   └── PromotionModal.tsx
├── lib/
│   ├── nexla.ts
│   ├── zero.ts
│   ├── pomerium.ts
│   ├── quest-planner.ts
│   ├── quest-store.ts
│   └── types.ts
├── data/
│   ├── customers.json
│   └── goals.json
├── public/
│   └── fallback-quests/
├── .env.example
└── README.md
```

---

# 15. Three-Person Build Plan

All builders work in parallel.

## Builder 1 — Product UI and Demo Flow

### Owns

- Main Next.js page
- Customer cards
- Quest card
- Loading/trace states
- XP progress
- Promotion animation
- Quest modal/page
- Overall visual polish
- Demo script flow

### Must not wait for integrations

Use mocked API responses first.

### Required mock functions

```ts
loadCustomerContext(customerId)
generateQuest(context)
buildQuestAsset(quest)
completeQuest(questId)
```

Replace mocks with real endpoints after the UI works.

### Definition of done

- All three personas can be selected.
- Each persona displays a different quest.
- Loading states are visible.
- Quest completion awards XP.
- Promotion animation works.
- UI can switch from mocks to real endpoints through one configuration flag.

---

## Builder 2 — Zero.xyz Deep Integration

### Owns

- Zero CLI/service setup
- Service discovery
- One real asset-creation capability
- Service invocation
- Response normalization
- Cost/run metadata
- Retry/fallback
- `/api/quests/:questId/build`

### Priority

Create one real hosted quest experience.

Do not attempt five Zero services.

### Definition of done

- Receives a quest and required capabilities.
- Searches Zero.
- Invokes one appropriate service.
- Returns a visible URL or artifact.
- Captures provider, cost, and run ID when available.
- Handles failure.
- Works from the frontend button.

---

## Builder 3 — Nexla, Pomerium, and Orchestration

### Owns

- Customer data
- Nexla ingestion/transformation
- Normalized context endpoint
- Pomerium-protected completion endpoint
- Quest-generation orchestration
- Shared types
- `.env.example`
- Integration verification

### Priority order

1. Stable customer-context endpoint
2. Real Nexla step
3. Quest-generation endpoint
4. Pomerium protection
5. Cross-integration testing

### Definition of done

- Frontend can load normalized context.
- Source is visibly labeled Nexla.
- Quest generation returns structured JSON.
- Completion endpoint is protected.
- Unauthorized request is rejected or visibly demonstrated.

---

# 16. Shared Integration Contract

Builders must agree on these types first:

- `CustomerContext`
- `Quest`
- `ZeroQuestAsset`

Do not change shared types without notifying the team.

## Mock-to-real switch

Use:

```env
NEXT_PUBLIC_USE_MOCKS=true
```

When integrations are ready:

```env
NEXT_PUBLIC_USE_MOCKS=false
```

The UI must work in both modes.

---

# 17. Git Workflow

Use three branches:

```text
feature/ui-demo
feature/zero-integration
feature/context-security
```

Suggested ownership:

- Builder 1: `feature/ui-demo`
- Builder 2: `feature/zero-integration`
- Builder 3: `feature/context-security`

## Commit rules

Make small commits:

```text
feat(ui): add customer selection
feat(zero): normalize asset response
feat(nexla): add customer context endpoint
feat(auth): protect completion endpoint
fix(demo): preserve fallback when zero fails
```

## Merge order

1. Shared types and base app
2. UI branch
3. Customer-context endpoint
4. Zero endpoint
5. Pomerium protection
6. Final demo fixes

Avoid large final merges.

---

# 18. Build Sequence

## Phase 1 — First 20 minutes

All builders:

- Read this README.
- Confirm the single demo flow.
- Agree on shared types.
- Confirm branches.
- Start the frontend with mocks.
- Start sponsor setup in parallel.

## Phase 2 — Next 30 minutes

- UI reaches complete mocked flow.
- Zero discovers and invokes one service.
- Nexla returns one normalized customer context.
- Pomerium protects one endpoint.

## Phase 3 — Next 25 minutes

- Replace mock customer context.
- Connect quest generation.
- Connect Zero build endpoint.
- Connect completion endpoint.
- Preserve mock fallback.

## Phase 4 — Final 15 minutes

- Test only the demo path.
- Remove broken controls.
- Seed deterministic data.
- Confirm all sponsor badges.
- Record fallback URLs.
- Rehearse pitch.

---

# 19. Acceptance Criteria

The MVP is complete only when the following are true.

## Product

- [ ] One business goal is visible.
- [ ] Three customer profiles are visible.
- [ ] Selecting a customer changes the context.
- [ ] The generated quest is clearly personalized.
- [ ] Maya and Omar receive visibly different quest mechanics.
- [ ] The customer can earn XP.
- [ ] A promotion can be demonstrated.

## Zero.xyz

- [ ] At least one real Zero service is invoked.
- [ ] The agent discovers the service after creating the quest.
- [ ] A visible quest asset is returned.
- [ ] Zero execution is shown in the UI.
- [ ] Failure does not break the demo.

## Nexla

- [ ] At least one real customer payload is normalized through Nexla.
- [ ] The normalized context drives quest generation.
- [ ] Nexla is visible in the execution trace.

## Pomerium

- [ ] One meaningful route or endpoint is protected.
- [ ] The UI shows identity verification.
- [ ] An unauthorized case can be explained or demonstrated.

## Demo reliability

- [ ] The exact demo works three consecutive times.
- [ ] The fallback works with internet/service failure.
- [ ] No unfinished pages are opened.
- [ ] The demo can complete in under 90 seconds.

---

# 20. Demo Script

## Opening

> Traditional loyalty programs give every customer the same referral link. But every customer influences people differently.

## Set the goal

> Our business has one goal: fill quiet Tuesday afternoons.

## Select Maya

> Maya is a social creator. Nexla gives the agent her normalized behavior and loyalty context.

Click **Create Quest**.

> The agent invents a social poll quest. It then discovers the required services through Zero and creates the playable experience.

Open the generated quest.

## Select Omar

> Omar rarely posts publicly. The same business goal should not give him Maya’s quest.

Click **Create Quest**.

> Omar receives a private coworker lunch quest. Zero creates the invitation or RSVP experience on demand.

## Complete the quest

Click **Complete Quest**.

> Pomerium protects the completion boundary so the correct user receives the reward.

Show XP and promotion.

## Close

> Traditional loyalty programs personalize rewards. QuestLoop personalizes and builds the action itself.

---

# 21. Judge Questions

## “Could this be built without Zero?”

Technically, a large team could prebuild many quest types and integrations.

But that would create a closed library.

Zero allows the agent to:

1. Invent the quest first.
2. Determine the required capabilities afterward.
3. Discover and execute the services at runtime.

The newly practical behavior is open-ended quest execution.

## “Why not just use one form provider?”

A single provider limits the quest formats.

One customer may need a poll. Another may need an event page. Another may need a QR code, image, or temporary site.

The point is not a specific service. It is dynamic capability acquisition.

## “How is Nexla more than a CSV?”

Nexla normalizes the business objective, customer profile, behavior, and history into the stable context consumed by the agent.

## “Why Pomerium?”

Points and rewards are valuable. Personalized quests may also contain private customer context.

Pomerium protects the boundary where a customer views or completes a quest.

## “Is the AI allowed to spam people?”

No. The MVP creates shareable assets. The customer decides whether to share them.

Consequential messaging requires explicit approval.

---

# 22. Failure and Fallback Plan

## Zero unavailable

- Use local quest-page fallback.
- Show a fallback event in the trace.
- Continue the demo.

## Nexla unavailable

- Load cached normalized context.
- Display “Cached Nexla context.”
- Continue.

## Pomerium unavailable

- Keep the route locally gated.
- Do not falsely claim the live policy succeeded.
- Explain the intended and implemented boundary honestly.

## Model returns invalid JSON

- Validate with a schema.
- Retry once.
- Use deterministic persona quest fallback.

## Generated page is slow

- Open a local mini-page first.
- Show the external URL separately when ready.

---

# 23. Environment Variables

```env
OPENAI_API_KEY=
ZERO_API_KEY=
ZERO_WALLET_BUDGET=
NEXLA_API_KEY=
NEXLA_FLOW_ID=
POMERIUM_URL=
POMERIUM_SHARED_SECRET=
NEXT_PUBLIC_USE_MOCKS=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Do not commit secrets.

---

# 24. Agent Guardrails

Every coding agent working on this repository must follow these rules:

1. Do not expand product scope.
2. Do not add a feature unless it supports the primary demo.
3. Preserve the single-page experience.
4. Keep Zero.xyz as the deepest integration.
5. Do not replace real Zero integration with hardcoded claims.
6. Preserve fallback behavior.
7. Do not expose secrets in client code.
8. Do not allow the model to return unvalidated JSON.
9. Do not allow quest completion without authorization.
10. Do not create public leaderboards.
11. Do not send external messages without approval.
12. Do not refactor working code during the final demo window.
13. Prefer a deterministic demo over a generalized architecture.
14. Keep all sponsor execution visible and understandable.
15. Stop when the acceptance criteria are met.

---

# 25. Copy-Paste Prompt for Coding Agents

```text
You are working on QuestLoop, a hackathon MVP.

Read README.md completely before modifying code.

The product:
A business has one goal. A customer is selected. An AI creates a personalized referral quest. Zero.xyz builds the required playable experience on demand. The customer completes it, earns XP, and may be promoted.

Sponsor priority:
1. Zero.xyz must be the deep, real, visible integration.
2. Nexla provides normalized customer context.
3. Pomerium protects a meaningful identity/reward boundary.

Primary demo:
- Fixed goal: Fill quiet Tuesday afternoons with new customers.
- Three customers: Maya, Omar, Lena.
- Maya gets a social poll quest.
- Omar gets a private coworker lunch quest.
- Lena gets a group event quest.
- At least one quest creates a real asset through Zero.
- Completion awards XP and triggers promotion.

Do not build:
Authentication UI, payments, CRM, leaderboards, multi-tenant accounts, a large dashboard, more personas, more goals, or complex infrastructure.

Before coding:
1. Identify which README acceptance criterion your change satisfies.
2. Inspect existing shared types and API contracts.
3. Preserve mock and fallback modes.
4. Avoid changing unrelated files.

After coding:
1. Run relevant tests or the app.
2. Report changed files.
3. Report which acceptance criteria now pass.
4. Report any remaining blockers honestly.
```

---

# 26. Final Definition

QuestLoop is not a points dashboard.

It is:

> A personalized quest engine that turns one business goal into a different playable growth experience for every customer.

Nexla understands the context.

Zero.xyz builds the quest machinery.

Pomerium protects identity and rewards.

The MVP wins when judges see:

> Same business goal. Different customer. Completely different live quest.
