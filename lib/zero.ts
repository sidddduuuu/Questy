import "server-only";

import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import { renderQuestPage } from "@/lib/quest-page";
import { QuestPlanSchema } from "@/lib/quest";
import type { CustomerContext } from "@/lib/customer";
import type { QuestBuildRequest, QuestPlan, ZeroQuestAsset } from "@/lib/quest";

const execFileAsync = promisify(execFile);
const HOST_CAPABILITY_URL = "https://host.withzero.ai/run";
const SEARCH_QUERY = "publish a small hosted HTML quest page and return a public URL";
const PLANNER_CAPABILITY_URL = "https://agent402.tools/api/llm";
const PLANNER_SEARCH_QUERY = "OpenAI GPT chat completion with JSON output";

const ZeroSearchSchema = z.object({
  capabilities: z.array(
    z.object({
      token: z.string().min(1),
      canonicalName: z.string().min(1),
      url: z.url(),
      availabilityStatus: z.string(),
      cost: z.object({ amount: z.string(), asset: z.string() }),
    }),
  ),
});

const ZeroCapabilitySchema = z.object({
  url: z.url(),
  method: z.literal("POST"),
  bodySchema: z.object({
    required: z.array(z.string()).default([]),
    properties: z.record(z.string(), z.unknown()),
  }),
});

const ZeroFetchSchema = z.object({
  runId: z.string().min(1),
  ok: z.boolean(),
  status: z.number(),
  body: z.unknown(),
});

const HostedPageSchema = z.object({
  url: z.url(),
  slug: z.string(),
  expiresAt: z.iso.datetime(),
  size: z.number().nonnegative(),
});

const PlannerResponseSchema = z.object({
  model: z.string(),
  provider: z.string(),
  choices: z.array(
    z.object({
      message: z.object({ role: z.string(), content: z.string() }),
      finish_reason: z.string(),
    }),
  ).min(1),
});

export type QuestPlanResult = {
  plan: QuestPlan;
  execution: {
    provider: string;
    model: string;
    runId: string;
    cost: number;
    reviewed: boolean;
    capabilityToken: string;
  };
};

async function getZeroCommand(): Promise<string> {
  if (process.env.ZERO_RUNNER) return process.env.ZERO_RUNNER;
  const provisionedRunner = join(homedir(), ".zero", "runtime", "bin", "zero");
  try {
    await access(provisionedRunner);
    return provisionedRunner;
  } catch {
    return "zero";
  }
}

async function runZeroJson<T>(args: string[], schema: z.ZodType<T>): Promise<T> {
  try {
    const { stdout } = await execFileAsync(await getZeroCommand(), args, {
      encoding: "utf8",
      maxBuffer: 1_000_000,
      timeout: 60_000,
    });
    return schema.parse(JSON.parse(stdout));
  } catch (error) {
    const output = z.object({ stdout: z.string() }).safeParse(error);
    if (output.success && output.data.stdout) {
      return schema.parse(JSON.parse(output.data.stdout));
    }
    throw new Error(`Zero ${args[0]} command failed`);
  }
}

async function reviewRun(
  runId: string,
  success: boolean,
  content: string,
): Promise<boolean> {
  const outcome = success ? "--success" : "--no-success";
  try {
    await execFileAsync(
      await getZeroCommand(),
      [
        "review",
        runId,
        outcome,
        "--accuracy",
        success ? "5" : "1",
        "--value",
        success ? "5" : "1",
        "--reliability",
        success ? "5" : "1",
        "--content",
        content,
      ],
      { encoding: "utf8", timeout: 30_000 },
    );
    return true;
  } catch {
    return false;
  }
}

export async function planQuest(
  customer: CustomerContext,
): Promise<QuestPlanResult> {
  const maxPay = z.coerce.number().min(0.01).max(0.05).parse(
    process.env.ZERO_PLANNER_MAX_PAY ?? "0.02",
  );
  const search = await runZeroJson(
    ["search", PLANNER_SEARCH_QUERY, "--json", "--status", "healthy", "--max-cost", String(maxPay), "--limit", "5"],
    ZeroSearchSchema,
  );
  const selected = search.capabilities.find(
    ({ url, availabilityStatus }) =>
      url === PLANNER_CAPABILITY_URL && availabilityStatus === "healthy",
  );
  if (!selected) throw new Error("No allowlisted Zero planning capability is healthy");

  const capability = await runZeroJson(
    ["get", selected.token, "--json"],
    ZeroCapabilitySchema,
  );
  if (
    capability.url !== PLANNER_CAPABILITY_URL ||
    !("messages" in capability.bodySchema.properties) ||
    !("response_format" in capability.bodySchema.properties)
  ) {
    throw new Error("Zero planning capability schema changed");
  }

  const result = await runZeroJson(
    [
      "fetch",
      capability.url,
      "--capability",
      selected.token,
      "--max-pay",
      String(maxPay),
      "--timeout",
      "120",
      "--json",
      "-d",
      JSON.stringify(plannerRequest(customer)),
    ],
    ZeroFetchSchema,
  );
  if (!result.ok) {
    await reviewRun(result.runId, false, "QuestLoop structured quest planning failed upstream.");
    throw new Error(`Zero planning failed with status ${result.status}`);
  }

  const response = PlannerResponseSchema.parse(result.body);
  try {
    const plan = QuestPlanSchema.parse(JSON.parse(response.choices[0].message.content));
    const reviewed = await reviewRun(
      result.runId,
      true,
      "Generated a schema-valid personalized QuestLoop referral quest from live customer context.",
    );
    return {
      plan,
      execution: {
        provider: selected.canonicalName,
        model: response.model,
        runId: result.runId,
        cost: Number(selected.cost.amount),
        reviewed,
        capabilityToken: selected.token,
      },
    };
  } catch (error) {
    await reviewRun(result.runId, false, "QuestLoop planner returned invalid structured quest JSON.");
    throw error;
  }
}

function plannerRequest(customer: CustomerContext) {
  return {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are the QuestLoop quest planner. Create one safe personalized referral quest that directly helps the business goal, matches the customer's natural sharing behavior, involves at least one new or returning customer, and is completable within seven days. Never expose private data or create spam, coercion, deception, or illegal activity. Keep the title under 10 words and description under 35 words.",
      },
      { role: "user", content: `Customer context: ${JSON.stringify(customer)}` },
    ],
    temperature: 0.2,
    max_tokens: 500,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "quest",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["title", "description", "rationale", "xpReward", "businessReward", "tier", "requiredCapabilities"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            rationale: { type: "string" },
            xpReward: { type: "integer", minimum: 100, maximum: 1000 },
            businessReward: { type: "string" },
            tier: { type: "string", enum: ["Explorer", "Connector", "Organizer", "Ambassador"] },
            requiredCapabilities: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
          },
        },
      },
    },
  };
}

export async function publishQuestPage(
  quest: QuestBuildRequest,
): Promise<ZeroQuestAsset> {
  const maxPay = z.coerce.number().min(0).max(0.05).parse(
    process.env.ZERO_MAX_PAY ?? "0.01",
  );
  const search = await runZeroJson(
    [
      "search",
      SEARCH_QUERY,
      "--json",
      "--status",
      "healthy",
      "--max-cost",
      String(maxPay),
      "--limit",
      "5",
    ],
    ZeroSearchSchema,
  );
  const selected = search.capabilities.find(
    ({ url, availabilityStatus }) =>
      url === HOST_CAPABILITY_URL && availabilityStatus === "healthy",
  );
  if (!selected) throw new Error("No allowlisted Zero hosting capability is healthy");

  const capability = await runZeroJson(
    ["get", selected.token, "--json"],
    ZeroCapabilitySchema,
  );
  if (
    capability.url !== HOST_CAPABILITY_URL ||
    !capability.bodySchema.required.includes("content") ||
    !("ttlHours" in capability.bodySchema.properties)
  ) {
    throw new Error("Zero hosting capability schema changed");
  }

  const result = await runZeroJson(
    [
      "fetch",
      capability.url,
      "--capability",
      selected.token,
      "--max-pay",
      String(maxPay),
      "--json",
      "-H",
      "X-ZAM-Access-Key: zeroclick",
      "-d",
      JSON.stringify({
        slug: `questloop-${quest.customerId}-${quest.id}`.slice(0, 64),
        content: renderQuestPage(quest),
        ttlHours: 336,
      }),
    ],
    ZeroFetchSchema,
  );

  if (!result.ok) {
    await reviewRun(
      result.runId,
      false,
      "QuestLoop page publishing did not return a usable hosted page.",
    );
    throw new Error(`Zero hosting failed with status ${result.status}`);
  }

  const hostedPage = HostedPageSchema.parse(result.body);
  const reviewed = await reviewRun(
    result.runId,
    true,
    "Published a QuestLoop customer quest page and received a working public URL.",
  );

  return {
    assetType: "page",
    provider: selected.canonicalName,
    url: hostedPage.url,
    runId: result.runId,
    cost: Number(selected.cost.amount),
    status: "created",
    raw: {
      capabilityToken: selected.token,
      expiresAt: hostedPage.expiresAt,
      size: hostedPage.size,
      reviewed,
    },
  };
}
