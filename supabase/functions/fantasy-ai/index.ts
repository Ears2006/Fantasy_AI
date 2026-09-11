import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
];

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
}

return new Response(JSON.stringify(data), {

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