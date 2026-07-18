import "server-only";

import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import { buildQuestFormRequest } from "@/lib/quest-form";
import { renderQuestPage } from "@/lib/quest-page";
import { QuestPlanSchema } from "@/lib/quest";
import type { CustomerContext } from "@/lib/customer";
import type { QuestBuildRequest, QuestPlan, ZeroQuestAsset } from "@/lib/quest";

const execFileAsync = promisify(execFile);
const HOST_CAPABILITY_URL = "https://host.withzero.ai/run";
const SEARCH_QUERY = "publish a small hosted HTML quest page and return a public URL";
const PLANNER_CAPABILITY_URL = "https://agent402.tools/api/llm";
const PLANNER_SEARCH_QUERY = "OpenAI GPT chat completion with JSON output";
const IMAGE_CAPABILITY_URL = "https://x402-gateway-production.up.railway.app/api/image/fast";
const IMAGE_SEARCH_QUERY = "fast image generation prompt";
const FORM_CAPABILITY_URL = "https://forms.withzero.xyz/api/v1/forms";
const FORM_SEARCH_QUERY = "create and host a public form with multiple choice questions";

const ZeroSearchSchema = z.object({
  capabilities: z.array(
    z.object({
      id: z.string().min(1),
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

const GeneratedImageSchema = z.object({
  model: z.string().min(1),
  images: z.array(z.object({
    url: z.url(),
    width: z.number().positive(),
    height: z.number().positive(),
  })).min(1),
  inference_time_ms: z.number().nonnegative(),
});

const HostedFormSchema = z.object({
  id: z.string().min(1),
  url: z.url(),
  submitUrl: z.url(),
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
    status: "created" | "fallback";
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
      timeout: 180_000,
    });
    return schema.parse(JSON.parse(stdout));
  } catch (error) {
    const output = z.object({ stdout: z.string() }).safeParse(error);
    if (output.success && output.data.stdout) {
      return schema.parse(JSON.parse(output.data.stdout));
    }
    throw new Error(`Zero ${args[0]} command failed`, { cause: error });
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
    ["get", selected.id, "--json"],
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
        status: "created",
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
          "You are the QuestLoop campaign planner. Create one safe personalized restaurant referral quest that directly helps the business goal and matches the customer's natural sharing behavior. Write ready-to-share copy for the correct channel: a public caption for public sharing, a private coworker invitation for private sharing, or a group invitation for group sharing. Include a clear response call to action, a detailed square food-photography image prompt with no text or logos, and exactly three distinct menu choices related to the customer's favorite product. Never expose private data or create spam, coercion, deception, or illegal activity. Keep the title under 10 words and description under 35 words.",
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
          required: ["title", "description", "rationale", "socialPost", "imagePrompt", "dishChoices", "xpReward", "businessReward", "tier", "requiredCapabilities"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            rationale: { type: "string" },
            socialPost: { type: "string" },
            imagePrompt: { type: "string" },
            dishChoices: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
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

async function findCapability(query: string, url: string, maxPay: number) {
  const search = await runZeroJson(
    ["search", query, "--json", "--status", "healthy", "--max-cost", String(maxPay), "--limit", "8"],
    ZeroSearchSchema,
  );
  const selected = search.capabilities.find(
    (capability) => capability.url === url && capability.availabilityStatus === "healthy",
  );
  if (!selected) throw new Error(`No allowlisted Zero capability is healthy for ${url}`);

  const capability = await runZeroJson(
    ["get", selected.id, "--json"],
    ZeroCapabilitySchema,
  );
  if (capability.url !== url) throw new Error(`Zero capability changed for ${url}`);
  return { capability, selected };
}

async function createCampaignImage(quest: QuestBuildRequest): Promise<ZeroQuestAsset> {
  const maxPay = z.coerce.number().min(0.015).max(0.05).parse(
    process.env.ZERO_IMAGE_MAX_PAY ?? "0.02",
  );
  const { capability, selected } = await findCapability(
    IMAGE_SEARCH_QUERY,
    IMAGE_CAPABILITY_URL,
    maxPay,
  );
  if (!("model" in capability.bodySchema.properties) || !("prompt" in capability.bodySchema.properties)) {
    throw new Error("Zero image capability schema changed");
  }

  const result = await runZeroJson(
    [
      "fetch", capability.url, "--capability", selected.token,
      "--max-pay", String(maxPay), "--timeout", "180", "--json",
      "-d", JSON.stringify({ model: "flux-schnell", prompt: quest.imagePrompt }),
    ],
    ZeroFetchSchema,
  );
  if (!result.ok) {
    await reviewRun(result.runId, false, "QuestLoop social campaign image generation failed upstream.");
    throw new Error(`Zero image generation failed with status ${result.status}`);
  }

  const generated = GeneratedImageSchema.parse(result.body);
  const image = generated.images[0];
  const reviewed = await reviewRun(
    result.runId,
    true,
    "Generated a ready-to-use square restaurant social campaign image for QuestLoop.",
  );
  return {
    assetType: "image",
    provider: selected.canonicalName,
    url: image.url,
    runId: result.runId,
    cost: Number(selected.cost.amount),
    status: "created",
    raw: { capabilityToken: selected.token, model: generated.model, width: image.width, height: image.height, reviewed },
  };
}

async function createDishChoiceForm(quest: QuestBuildRequest): Promise<ZeroQuestAsset> {
  const maxPay = z.coerce.number().min(0).max(0.02).parse(
    process.env.ZERO_FORM_MAX_PAY ?? "0.01",
  );
  const { capability, selected } = await findCapability(
    FORM_SEARCH_QUERY,
    FORM_CAPABILITY_URL,
    maxPay,
  );
  if (
    !capability.bodySchema.required.includes("schema") ||
    !capability.bodySchema.required.includes("recipients")
  ) {
    throw new Error("Zero Forms capability schema changed");
  }

  const recipient = z.email().parse(
    process.env.QUESTLOOP_FORM_RECIPIENT ??
      process.env.POMERIUM_ADMIN_EMAILS?.split(",")[0]?.trim(),
  );
  const result = await runZeroJson(
    [
      "fetch", capability.url, "--capability", selected.token,
      "--max-pay", String(maxPay), "--timeout", "120", "--json",
      "-d", JSON.stringify(buildQuestFormRequest(quest, recipient)),
    ],
    ZeroFetchSchema,
  );
  if (!result.ok) {
    await reviewRun(result.runId, false, "QuestLoop restaurant choice form creation failed upstream.");
    throw new Error(`Zero Forms failed with status ${result.status}`);
  }

  const form = HostedFormSchema.parse(result.body);
  const reviewed = await reviewRun(
    result.runId,
    true,
    quest.customerId === "omar"
      ? "Created a live coworker lunch RSVP form with time, meal, and dietary fields for QuestLoop."
      : "Created a public three-choice restaurant campaign form for QuestLoop.",
  );
  return {
    assetType: "form",
    provider: selected.canonicalName,
    url: form.url,
    runId: result.runId,
    cost: Number(selected.cost.amount),
    status: "created",
    raw: { capabilityToken: selected.token, formId: form.id, submitUrl: form.submitUrl, reviewed },
  };
}

async function publishQuestPage(
  quest: QuestBuildRequest,
  image: ZeroQuestAsset,
  form: ZeroQuestAsset,
): Promise<ZeroQuestAsset> {
  const maxPay = z.coerce.number().min(0).max(0.05).parse(
    process.env.ZERO_MAX_PAY ?? "0.01",
  );
  const { capability, selected } = await findCapability(
    SEARCH_QUERY,
    HOST_CAPABILITY_URL,
    maxPay,
  );
  if (
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
        content: renderQuestPage(quest, image.url!, form.url!),
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

export async function buildQuestCampaign(
  quest: QuestBuildRequest,
): Promise<ZeroQuestAsset[]> {
  const [image, form] = await Promise.all([
    createCampaignImage(quest),
    createDishChoiceForm(quest),
  ]);
  const page = await publishQuestPage(quest, image, form);
  return [image, form, page];
}
