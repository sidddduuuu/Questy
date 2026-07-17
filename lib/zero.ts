import "server-only";

import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import { renderQuestPage } from "@/lib/quest-page";
import type { QuestBuildRequest, ZeroQuestAsset } from "@/lib/quest";

const execFileAsync = promisify(execFile);
const HOST_CAPABILITY_URL = "https://host.withzero.ai/run";
const SEARCH_QUERY = "publish a small hosted HTML quest page and return a public URL";

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
    required: z.array(z.string()),
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

async function reviewRun(runId: string, success: boolean): Promise<boolean> {
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
        success
          ? "Published a QuestLoop customer quest page and received a working public URL."
          : "QuestLoop page publishing did not return a usable hosted page.",
      ],
      { encoding: "utf8", timeout: 30_000 },
    );
    return true;
  } catch {
    return false;
  }
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
    await reviewRun(result.runId, false);
    throw new Error(`Zero hosting failed with status ${result.status}`);
  }

  const hostedPage = HostedPageSchema.parse(result.body);
  const reviewed = await reviewRun(result.runId, true);

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
