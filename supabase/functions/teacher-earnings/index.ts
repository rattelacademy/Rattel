import { authenticate, isAuthenticatedRequest, json, methodNotAllowed, options } from "../_shared/financial.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return options(request);
  if (request.method !== "GET") return methodNotAllowed(request);

  const auth = await authenticate(request);
  if (!isAuthenticatedRequest(auth)) return auth;
  const teacherId = new URL(request.url).searchParams.get("teacher_id");
  if (!teacherId) return json(request, { error: "teacher_id_required" }, 400);
  if (!auth.roles.includes("owner") && !(auth.roles.includes("teacher") && teacherId === auth.user.id)) {
    return json(request, { error: "forbidden" }, 403);
  }

  const { data, error } = await auth.client
    .from("teacher_earnings")
    .select("id, period_start, period_end, amount, currency, status, created_at")
    .eq("teacher_id", teacherId)
    .order("period_start", { ascending: false });
  if (error) return json(request, { error: "request_failed" }, 500);
  return json(request, { earnings: data ?? [] });
});
