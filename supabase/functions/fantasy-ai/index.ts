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

console.log(
  "FANTASYPROS FIRST 20 PLAYERS:",
  projectionPlayers
    .slice(0, 20)
    .map((player: any) => ({
      name: player.name,
      position: player.position_id,
      team: player.team_id,
      fpid: player.fpid,
    }))
);

const normalizedPlayerName = playerName.trim().toLowerCase();

const playerProjection = projectionPlayers.find((player: any) => {
  const name = String(player.name ?? "").trim().toLowerCase();
  const playerPosition = String(player.position_id ?? "").toUpperCase();

  return (
    name === normalizedPlayerName &&
    playerPosition === position.toUpperCase()
  );
});

if (!playerProjection) {
  throw new Error(
    `No FantasyPros projection found for ${playerName} at ${position}`
  );
}

  return playerProjection;
  // FantasyPros projection lookup 
  if (!playerProjection) {
  throw new Error(
    `No FantasyPros projection found for ${playerName} at ${position}`
  );
}

return playerProjection;
}

const fantasyAiInstructions = `
You are FF AI, a data-driven fantasy football analyst.

Use available tools whenever answering questions involving current NFL players,
fantasy projections, rankings, injuries, news, matchups, or recommendations.
Never invent current projections, statistics, injuries, rankings, or news.

Default behavior:
- Use the current NFL season unless the user explicitly specifies another season.
- For predictions and recommendations, use the next applicable NFL week unless the user specifies another week.
- Never ask the user what season they mean when discussing the current season.
- If league scoring settings are available, use them.
- If scoring settings are unavailable and the user does not specify a format, assume PPR and briefly state that assumption.
- Preserve details already supplied earlier in the conversation. Do not ask the user to repeat information already provided.
- Give the most complete useful answer possible from available data instead of asking unnecessary follow-up questions.
- For player projections, use the player_projection tool rather than estimating from general knowledge.
- When projection data provides statistical projections, include the useful predicted stats along with projected fantasy points.
`;

async function getCurrentNflContext() {
  const response = await fetch("https://api.sleeper.app/v1/state/nfl");

  if (!response.ok) {
    throw new Error(
      `Sleeper NFL state request failed (${response.status})`
    );
  }

  const state = await response.json();

  return {
    season: Number(state.season),
    week: Number(state.week),
    seasonType: state.season_type,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const nflContext = await getCurrentNflContext();

  const currentFantasyAiInstructions = `${fantasyAiInstructions}

Authoritative current NFL context:
- Season: ${nflContext.season}
- Week: ${nflContext.week}
- Season type: ${nflContext.seasonType}

Treat this NFL context as authoritative.
When the user says "this week", "current week", or does not specify a week for a current projection, use Week ${nflContext.week} of the ${nflContext.season} season.
If the user explicitly specifies a different season or week, use the user's requested season or week instead.
Do not guess the current NFL week or season from your own knowledge.
`;

console.log(
  "CURRENT NFL CONTEXT:",
  nflContext.season,
  nflContext.week,
  nflContext.seasonType
);

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

   const { message, history = [] } = await req.json();

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
        instructions: currentFantasyAiInstructions,

        tools: tools,
        tool_choice: "auto",
    
        
       input: [
  ...history.map((item: any) => ({
    role: item.role,
    content: item.content,
  })),
  {
    role: "user",
    content: message,
  },
],
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
let currentData = data;
let toolRounds = 0;
const maxToolRounds = 5;

while (toolRounds < maxToolRounds) {
  const toolCalls = currentData.output?.filter(
    (item: any) =>
      item.type === "function_call" &&
      (
        item.name === "player_search" ||
        item.name === "player_projection"
      )
  ) ?? [];

  if (toolCalls.length === 0) {
    break;
  }

  toolRounds++;

  console.log(
    `AI TOOL ROUND ${toolRounds}:`,
    toolCalls.map((call: any) => call.name)
  );

  const toolOutputs = [];

  for (const toolCall of toolCalls) {
    console.log(
      "AI TOOL CALLED:",
      toolCall.name,
      toolCall.arguments
    );

    const args = JSON.parse(toolCall.arguments);

    let toolResult;

    if (toolCall.name === "player_search") {
      toolResult = await searchSleeperPlayers(args.query);
    } else if (toolCall.name === "player_projection") {
      toolResult = await getFantasyProsProjection(
        args.playerName,
        args.position,
        args.season,
        args.week,
        args.scoringFormat
      );
    }

    console.log("AI TOOL RESULT:", toolCall.name, toolResult);

    toolOutputs.push({
      type: "function_call_output",
      call_id: toolCall.call_id,
      output: JSON.stringify(toolResult),
    });
  }

  const nextResponse = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-terra",
        instructions: currentFantasyAiInstructions,
        previous_response_id: currentData.id,
        tools: tools,
        tool_choice: "auto",
        input: toolOutputs,
      }),
    }
  );

  if (!nextResponse.ok) {
    const errorText = await nextResponse.text();

    throw new Error(
      `OpenAI tool follow-up failed (${nextResponse.status}): ${errorText}`
    );
  }

  currentData = await nextResponse.json();
}

if (toolRounds >= maxToolRounds) {
  const remainingToolCall = currentData.output?.some(
    (item: any) => item.type === "function_call"
  );

  if (remainingToolCall) {
    throw new Error("AI exceeded maximum tool rounds");
  }
}

return new Response(JSON.stringify(currentData), {
  headers: {
    ...corsHeaders,
    "Content-Type": "application/json",
  },
});
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