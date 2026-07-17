import "server-only";

import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import cachedCustomerData from "@/data/nexla-context-cache.json";
import {
  CustomerContextSchema,
  type CustomerContext,
  type CustomerId,
} from "@/lib/customer";

const CUSTOMER_MAP_NAME = "QuestLoop Customer Context";

const NexlaEnvironmentSchema = z.object({
  BASE_URL: z.url(),
  ACCESS_TOKEN: z.string().min(1),
});

const NexlaMapListSchema = z.array(
  z.object({ id: z.number().int().positive(), name: z.string() }),
);

const CachedCustomersSchema = z.array(CustomerContextSchema).length(3);

type NexlaConfig = { baseUrl: string; accessToken: string };
export type NexlaSource = "nexla" | "nexla-cache";

async function getNexlaConfig(): Promise<NexlaConfig> {
  if (process.env.NEXLA_API_URL && process.env.NEXLA_ACCESS_TOKEN) {
    return {
      baseUrl: z.url().parse(process.env.NEXLA_API_URL).replace(/\/$/, ""),
      accessToken: process.env.NEXLA_ACCESS_TOKEN,
    };
  }

  const credentialsPath =
    process.env.NEXLA_CREDS_FILE ??
    join(homedir(), ".config", "nexla", "credentials.json");
  const credentials = z
    .object({ current_env: z.string().min(1) })
    .catchall(z.unknown())
    .parse(JSON.parse(await readFile(credentialsPath, "utf8")));
  const environment = NexlaEnvironmentSchema.parse(
    credentials[credentials.current_env],
  );

  return {
    baseUrl: environment.BASE_URL.replace(/\/$/, ""),
    accessToken: environment.ACCESS_TOKEN,
  };
}

async function nexlaRequest(path: string): Promise<unknown> {
  const { baseUrl, accessToken } = await getNexlaConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Accept: "application/vnd.nexla.api.v1+json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Nexla request failed with status ${response.status}`);
  }

  return response.json();
}

async function getCustomerMapId(): Promise<number> {
  const configuredId = process.env.NEXLA_CUSTOMER_MAP_ID;
  if (configuredId) return z.coerce.number().int().positive().parse(configuredId);

  const maps = NexlaMapListSchema.parse(await nexlaRequest("/data_maps"));
  const customerMap = maps.find(({ name }) => name === CUSTOMER_MAP_NAME);
  if (!customerMap) throw new Error(`Nexla lookup "${CUSTOMER_MAP_NAME}" not found`);
  return customerMap.id;
}

async function getCustomerFromMap(
  mapId: number,
  customerId: CustomerId,
): Promise<CustomerContext | null> {
  const entries = z
    .array(CustomerContextSchema)
    .parse(
      await nexlaRequest(
        `/data_maps/${mapId}/entries/${encodeURIComponent(customerId)}`,
      ),
    );

  return entries.find(({ id }) => id === customerId) ?? null;
}

function getCachedCustomers(): CustomerContext[] {
  return CachedCustomersSchema.parse(cachedCustomerData);
}

export async function getCustomerContext(
  customerId: CustomerId,
): Promise<{ context: CustomerContext | null; source: NexlaSource }> {
  try {
    const context = await getCustomerFromMap(await getCustomerMapId(), customerId);
    if (context) return { context, source: "nexla" };
  } catch {
    // The validated Nexla snapshot below keeps the demo usable during outages.
  }

  return {
    context: getCachedCustomers().find(({ id }) => id === customerId) ?? null,
    source: "nexla-cache",
  };
}

export async function getAllCustomerContexts(): Promise<{
  customers: CustomerContext[];
  source: NexlaSource;
}> {
  try {
    const mapId = await getCustomerMapId();
    const customerIds = ["maya", "omar", "lena"] as const;
    const customers = await Promise.all(
      customerIds.map((customerId) => getCustomerFromMap(mapId, customerId)),
    );
    const complete = customers.filter(
      (customer): customer is CustomerContext => customer !== null,
    );
    if (complete.length === customerIds.length) {
      return { customers: complete, source: "nexla" };
    }
  } catch {
    // Fall through to the last validated Nexla output.
  }

  return { customers: getCachedCustomers(), source: "nexla-cache" };
}
