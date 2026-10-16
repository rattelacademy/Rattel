import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const allowedOrigins = new Set(
  (Deno.env.get("APP_ALLOWED_ORIGINS") ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

export function corsHeaders(request: Request): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Cache-Control": "no-store",
    Vary: "Origin",
  });
  const origin = request.headers.get("origin");
  if (origin && allowedOrigins.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

export function json(request: Request, body: unknown, status = 200): Response {
  const headers = corsHeaders(request);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

export function options(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

type AuthenticatedRequest = { client: SupabaseClient; user: User; roles: string[] };

export async function authenticate(request: Request): Promise<AuthenticatedRequest | Response> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json(request, { error: "unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !publishableKey) return json(request, { error: "server_misconfigured" }, 500);

  const client = createClient(url, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await client.auth.getUser(token);
  if (authError || !user) return json(request, { error: "unauthorized" }, 401);

  const { data: roles, error: roleError } = await client.from("user_roles").select("role");
  if (roleError) return json(request, { error: "forbidden" }, 403);
  return { client, user, roles: (roles ?? []).map(({ role }) => role) };
}

export function isAuthenticatedRequest(value: AuthenticatedRequest | Response): value is AuthenticatedRequest {
  return !(value instanceof Response);
}

export function methodNotAllowed(request: Request): Response {
  return json(request, { error: "method_not_allowed" }, 405);
}
