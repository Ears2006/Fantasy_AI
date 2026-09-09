// Secure FantasyPros API proxy — Supabase Edge Function.
//
// The FantasyPros API key is stored as a server-side secret (FANTASYPROS_API_KEY).
// It is NEVER exposed to the browser.
//
// API reference: https://api.fantasypros.com/public/v2/docs
// Base URL: https://api.fantasypros.com/public/v2/json
// Auth: x-api-key header
//
// Routes (via ?endpoint= query param):
//   status              — check if the API key is configured
//   projections         — GET /nfl/{season}/projections (?position=&scoring=&week=)
//   player-points       — GET /nfl/{season}/player-points (?week_start=&week_end=&scoring=)
//   consensus-rankings  — GET /nfl/{season}/consensus-rankings (?position=&scoring=&week=)
//   rankings            — GET /nfl/{season}/rankings (?position=&scoring=)
//   injuries            — GET /nfl/injuries (?season=&week=)
//   news                — GET /nfl/news (?player_id=&limit=)
//   players             — GET /nfl/players
//
// // TODO-INTEGRATION: FANTASYPROS_API
// To configure: set the FANTASYPROS_API_KEY secret via Supabase dashboard or CLI:
//   supabase secrets set FANTASYPROS_API_KEY=your_key_here

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FP_API_BASE = "https://api.fantasypros.com/public/v2/json";
const REQUEST_TIMEOUT_MS = 15000;

// Centralized endpoint path + query parameter configuration.
// Each builder returns the full path and query string for the FantasyPros API.
interface FPEndpointConfig {
  path: (params: Record<string, string>) => string;
  // Which query params to forward to FantasyPros (beyond our internal ones)
  forwardParams?: string[];
}

const ENDPOINT_CONFIG: Record<string, FPEndpointConfig> = {
  projections: {
    path: (p) => `/nfl/${p.season ?? "2025"}/projections`,
    forwardParams: ["position", "scoring", "week", "type"],
  },
  "player-points": {
    path: (p) => `/nfl/${p.season ?? "2025"}/player-points`,
    forwardParams: ["week_start", "week_end", "scoring"],
  },
  "consensus-rankings": {
    path: (p) => `/nfl/${p.season ?? "2025"}/consensus-rankings`,
    forwardParams: ["position", "scoring", "week", "type"],
  },
  rankings: {
    path: (p) => `/nfl/${p.season ?? "2025"}/rankings`,
    forwardParams: ["position", "scoring", "week"],
  },
  injuries: {
    path: () => `/nfl/injuries`,
    forwardParams: ["season", "week"],
  },
  news: {
    path: () => `/nfl/news`,
    forwardParams: ["player_id", "limit", "category"],
  },
  players: {
    path: () => `/nfl/players`,
    forwardParams: ["position"],
  },
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

    const config = ENDPOINT_CONFIG[endpoint];
    if (!config) {
      return jsonResponse(
        { error: `Unknown endpoint: ${endpoint}` },
        400,
      );
    }

    // Build the FantasyPros URL with forwarded query params.
    const fpPath = config.path(params);
    const fpUrl = new URL(`${FP_API_BASE}${fpPath}`);

    // Forward allowed query params to FantasyPros.
    if (config.forwardParams) {
      for (const paramName of config.forwardParams) {
        const value = params[paramName];
        if (value) {
          fpUrl.searchParams.set(paramName, value);
        }
      }
    }

    // Fetch with timeout.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let fpResp: Response;
    try {
      fpResp = await fetch(fpUrl.toString(), {
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
      // Read the error body for more context (without exposing the API key).
      let errorDetail = "";
      try {
        const errorBody = await fpResp.text();
        // Only include a short snippet, no headers or auth info.
        errorDetail = errorBody.slice(0, 200);
      } catch {
        // Ignore — just report the status code.
      }
      return jsonResponse(
        { error: `FantasyPros API returned ${fpResp.status}`, detail: errorDetail || undefined },
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
