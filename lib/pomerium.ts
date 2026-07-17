import { PomeriumVerifier } from "@pomerium/js-sdk";
import { z } from "zod";
import { CustomerIdSchema, type CustomerId } from "./customer.ts";

const PomeriumConfigSchema = z.object({
  POMERIUM_ISSUER: z.string().min(1),
  POMERIUM_AUDIENCE: z.string().min(1),
});

const PomeriumIdentitySchema = z.object({
  sub: z.string().min(1),
  email: z.email().optional(),
  groups: z.array(z.string()).default([]),
  customer_id: CustomerIdSchema.optional(),
});

export type PomeriumIdentity = z.infer<typeof PomeriumIdentitySchema>;

export async function verifyPomeriumIdentity(
  request: Request,
): Promise<PomeriumIdentity> {
  const assertion = request.headers.get("x-pomerium-jwt-assertion");
  if (!assertion) throw new Error("Missing Pomerium assertion");

  const config = PomeriumConfigSchema.parse(process.env);
  const verifier = new PomeriumVerifier({
    issuer: config.POMERIUM_ISSUER,
    audience: config.POMERIUM_AUDIENCE.split(",").map((value) => value.trim()),
  });
  const { payload } = await verifier.verifyJwt(assertion);
  return PomeriumIdentitySchema.parse(payload);
}

export function canCompleteQuest(
  identity: PomeriumIdentity,
  customerId: CustomerId,
  adminGroup = process.env.POMERIUM_ADMIN_GROUP ?? "questloop-admin",
): boolean {
  return (
    identity.customer_id === customerId || identity.groups.includes(adminGroup)
  );
}
