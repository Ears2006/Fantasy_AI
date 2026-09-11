import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Fantasy AI Edge Function — OpenAI proxy with player search tool.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* sleeper player */
async function searchSleeperPlayers(query: string) {
  const response = await fetch(
    "https://api.sleeper.app/v1/players/nfl?active=true"
  );

  if (!response.ok) {
    throw new Error("Sleeper player request failed");
  }

  const players = await response.json();
  const normalizedQuery = query.trim().toLowerCase();

  const matches = Object.values(players)
    .filter((player: any) => {
      const name =
        player.full_name ??
        `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim();

      return name.toLowerCase().includes(normalizedQuery);
    })
    .slice(0, 10)
    .map((player: any) => ({
      playerId: player.player_id,
      name:
        player.full_name ??
        `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim(),
      position: player.position,
      team: player.team,
      status: player.status,
    }));

  return matches;
}

/* Player search */
const tools = [
  {
    type: "function",
    name: "player_search",
    description:
      "Search for an NFL fantasy football player by name. Use this when you need to identify a player before answering questions about them.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The player's name or partial name.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "player_projection",
    description:
      "Get current weekly fantasy football projections for an NFL player. Use this when answering start/sit, matchup, or projected fantasy performance questions.",
    parameters: {
      type: "object",
      properties: {
        playerName: {
          type: "string",
          description: "The NFL player's full name, such as Josh Allen.",
},
        position: {
          type: "string",
          description: "The player's position, such as QB, RB, WR, or TE.",
        },
        season: {
          type: "number",
          description: "NFL season year.",
        },
        week: {
          type: "number",
          description: "NFL week number.",
        },
        scoringFormat: {
          type: "string",
          enum: ["Standard", "Half-PPR", "PPR"],
          description: "Fantasy league scoring format.",
        },
      },
      required: [
        "playerName",
        "position",
        "season",
        "week",
        "scoringFormat",
      ],
      additionalProperties: false,
    },
  },
];

async function getFantasyProsProjection(
  playerName: string,
  position: string,
  season: number,
  week: number,
  scoringFormat: string
) {
  const fpScoring =
  scoringFormat === "Half-PPR"
    ? "HALF"
    : scoringFormat === "PPR"
    ? "PPR"
    : "STD";

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are missing");
}

const fantasyDataUrl = new URL(
  `${supabaseUrl}/functions/v1/fantasy-data`
);

fantasyDataUrl.searchParams.set("endpoint", "projections");
fantasyDataUrl.searchParams.set("season", String(season));
fantasyDataUrl.searchParams.set("week", String(week));
fantasyDataUrl.searchParams.set("position", position);
fantasyDataUrl.searchParams.set("scoring", fpScoring);

  const projectionResponse = await fetch(fantasyDataUrl.toString(), {
  headers: {
    Authorization: `Bearer ${supabaseAnonKey}`,
    apikey: supabaseAnonKey,
  },
});

if (!projectionResponse.ok) {
  throw new Error(
    `Fantasy data request failed with status ${projectionResponse.status}`
  );
}

const projectionData = await projectionResponse.json();

  const rawData = projectionData.data ?? projectionData;

const projectionPlayers =
  rawData.players ?? rawData.data ?? [];

console.log(
  "FANTASYPROS PROJECTIONS RECEIVED:",
  projectionPlayers.length
);
  // FantasyPros projection lookup will go here next.
  console.log("PROJECTION TOOL REQUEST:", {
    playerName,
    position,
    season,
    week,
    scoringFormat,
  });

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-terra",
        reasoning: {
          effort: "low",
        },
        tools: tools,
        tool_choice: "auto",
    
        
        input: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI request failed:", response.status);

      return new Response(
        JSON.stringify({
          error: "OpenAI request failed",
          status: response.status,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    /* Detect player search tool call */
const toolCall = data.output?.find(
  (item: any) =>
    item.type === "function_call" &&
    item.name === "player_search"
);

if (toolCall) {
  console.log("PLAYER SEARCH TOOL CALLED:", toolCall.arguments);

  const args = JSON.parse(toolCall.arguments);
  const playerResults = await searchSleeperPlayers(args.query);

  console.log("SLEEPER PLAYER RESULTS:", playerResults);

  
  const finalResponse = await fetch(
  "https://api.openai.com/v1/responses",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-terra",
      previous_response_id: data.id,
      input: [
        {
          type: "function_call_output",
          call_id: toolCall.call_id,
          output: JSON.stringify(playerResults),
        },
      ],
    }),
  }
);

const finalData = await finalResponse.json();

return new Response(JSON.stringify(finalData), {
  headers: {
    ...corsHeaders,
    "Content-Type": "application/json",
  },
});
}
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(
      "Fantasy AI error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});