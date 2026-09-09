// Secure FantasyPros API proxy — Supabase Edge Function.
//
// The FantasyPros API key is stored as a server-side secret (FANTASYPROS_API_KEY).
// It is NEVER exposed to the browser.
//
// Routes (via ?endpoint= query param):
//   status       — check if the API key is configured
//   projections  — weekly projections (?season=&week=&scoring=&position=)
//   points       — actual fantasy points (?season=&week=&scoring=)
//   rankings     — consensus rankings (?week=&scoring=&position=)
//   injuries     — current injury report
//   news         — player news (?playerId=)
//   players      — player metadata (for crosswalk building)
//
// // TODO-INTEGRATION: FANTASYPROS_API
// To configure: set the FANTASYPROS_API_KEY secret via Supabase dashboard or CLI:
//   supabase secrets set FANTASYPROS_API_KEY=your_key_here
//
// All responses include mandatory CORS headers.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FP_API_BASE = "https://api.fantasypros.com/v2/json";
const REQUEST_TIMEOUT_MS = 10000;

// Centralized endpoint path configuration.
const ENDPOINT_PATHS: Record<string, (params: Record<string, string>) => string> = {
  projections: (p) => `/nfl/projections/${p.scoring ?? 'STD'}/${p.week ?? '1'}/${p.season ?? '2025'}`,
  points: (p) => `/nfl/points/${p.scoring ?? 'STD'}/${p.week ?? '1'}/${p.season ?? '2025'}`,
  rankings: (p) => `/nfl/rankings/${p.scoring ?? 'STD'}/${p.week ?? '1'}/${p.season ?? '2025'}`,
  injuries: () => `/nfl/injuries`,
  news: () => `/nfl/news`,
  players: () => `/nfl/players`,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint") ?? "";
    const params: Record<string, string> = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== "endpoint") params[key] = value;
    }

    // Status check — no API key needed, just reports if configured.
    if (endpoint === "status") {
      const apiKey = Deno.env.get("FANTASYPROS_API_KEY");
      return jsonResponse({
        data: {
          available: !!apiKey,
          provider: "FantasyPros",
          message: apiKey ? "FantasyPros API is configured." : "FANTASYPROS_API_KEY not set.",
        },
      });
    }

    const apiKey = Deno.env.get("FANTASYPROS_API_KEY");
    if (!apiKey) {
      return jsonResponse(
        { error: "FantasyPros API key not configured. Set FANTASYPROS_API_KEY server-side." },
        503,
      );
    }

    const pathBuilder = ENDPOINT_PATHS[endpoint];
    if (!pathBuilder) {
      return jsonResponse(
        { error: `Unknown endpoint: ${endpoint}` },
        400,
      );
    }

    const path = pathBuilder(params);
    const fpUrl = `${FP_API_BASE}${path}`;

    // Fetch with timeout.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let fpResp: Response;
    try {
      fpResp = await fetch(fpUrl, {
        headers: {
          "x-api-key": apiKey,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const msg = fetchErr instanceof Error ? fetchErr.message : "Network error";
      return jsonResponse(
        { error: `FantasyPros API request failed: ${msg}` },
        502,
      );
    }
    clearTimeout(timeoutId);

    if (!fpResp.ok) {
      return jsonResponse(
        { error: `FantasyPros API returned ${fpResp.status}` },
        fpResp.status,
      );
    }

    const data = await fpResp.json();
    return jsonResponse({ data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return jsonResponse({ error: msg }, 500);
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
