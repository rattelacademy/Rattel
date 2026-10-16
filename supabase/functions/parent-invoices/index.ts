import { authenticate, isAuthenticatedRequest, json, methodNotAllowed, options } from "../_shared/financial.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return options(request);
  if (request.method !== "GET") return methodNotAllowed(request);

  const auth = await authenticate(request);
  if (!isAuthenticatedRequest(auth)) return auth;
  const parentId = new URL(request.url).searchParams.get("parent_id");
  if (!parentId) return json(request, { error: "parent_id_required" }, 400);
  if (!auth.roles.includes("owner") && !(auth.roles.includes("parent") && parentId === auth.user.id)) {
    return json(request, { error: "forbidden" }, 403);
  }

  const { data, error } = await auth.client
    .from("parent_invoice_summary")
    .select("id, amount, currency, status, issued_at")
    .eq("parent_id", parentId)
    .order("issued_at", { ascending: false });
  if (error) return json(request, { error: "request_failed" }, 500);
  return json(request, { invoices: data ?? [] });
});
