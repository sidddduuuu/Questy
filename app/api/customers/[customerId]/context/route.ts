import { CustomerIdSchema } from "@/lib/customer";
import { getCustomerContext } from "@/lib/nexla";

type RouteContext = { params: Promise<{ customerId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const parsedId = CustomerIdSchema.safeParse((await params).customerId);
  if (!parsedId.success) {
    return Response.json(
      { success: false, error: "Unknown customer" },
      { status: 400 },
    );
  }

  try {
    const { context, source } = await getCustomerContext(parsedId.data);
    if (!context) {
      return Response.json(
        { success: false, error: "Customer context not found" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, source, context });
  } catch {
    return Response.json(
      { success: false, error: "Nexla customer context is unavailable" },
      { status: 502 },
    );
  }
}
