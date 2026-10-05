import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Candidate = {
  name: string;
  playerId?: string;
  position?: string;
  projection?: number;
};

type SleeperStatRow = {
  player_id?: string;
  playerId?: string;
  stats?: Record<string, number>;
};

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateFantasyPoints(
  stats: Record<string, number>,
  scoringFormat: string | null
): number {
  const format = (scoringFormat ?? "Standard").toLowerCase();

  const receptionPoints =
    format.includes("half") ? 0.5 :
    format.includes("ppr") ? 1 :
    0;

  const points =
    numberValue(stats.pass_yd) * 0.04 +
    numberValue(stats.pass_td) * 6 -
    numberValue(stats.pass_int) * 2 +
    numberValue(stats.rush_yd) * 0.1 +
    numberValue(stats.rush_td) * 6 +
    numberValue(stats.rec_yd) * 0.1 +
    numberValue(stats.rec_td) * 6 +
    numberValue(stats.rec) * receptionPoints -
    numberValue(stats.fum_lost) * 2 +
    numberValue(stats.pass_2pt) * 2 +
    numberValue(stats.rush_2pt) * 2 +
    numberValue(stats.rec_2pt) * 2;

  return Math.round(points * 100) / 100;
}

async function fetchWeekStats(
  season: number,
  week: number
): Promise<SleeperStatRow[]> {
  const urls = [
    `https://api.sleeper.com/stats/nfl/regular/${season}/${week}`,
    `https://api.sleeper.app/v1/stats/nfl/regular/${season}/${week}`,
  ];

  for (const url of urls) {
    const response = await fetch(url);

    if (!response.ok) {
      continue;
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === "object") {
      return Object.entries(data).map(([playerId, value]: [string, any]) => ({
        player_id: value?.player_id ?? playerId,
        stats: value?.stats ?? value,
      }));
    }
  }

  throw new Error(
    `Unable to retrieve Sleeper stats for ${season} Week ${week}`
  );
}

async function fetchPlayerDirectory(): Promise<Record<string, any>> {
  const response = await fetch(
    "https://api.sleeper.app/v1/players/nfl?active=true"
  );

  if (!response.ok) {
    throw new Error("Unable to retrieve Sleeper player directory");
  }

  return await response.json();
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findPlayerIdByName(
  playerName: string,
  players: Record<string, any>
): string | null {
  const wantedName = normalizeName(playerName);

  for (const [playerId, player] of Object.entries(players)) {
    const fullName =
      player.full_name ??
      `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim();

    if (normalizeName(fullName) === wantedName) {
      return playerId;
    }
  }

  return null;
}

function createStatsMap(
  rows: SleeperStatRow[]
): Map<string, Record<string, number>> {
  const map = new Map<string, Record<string, number>>();

  for (const row of rows) {
    const playerId = row.player_id ?? row.playerId;

    if (playerId) {
      map.set(String(playerId), row.stats ?? {});
    }
  }

  return map;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = req.headers.get("Authorization");

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !serviceRoleKey
    ) {
      throw new Error("Required Supabase environment variables are missing");
    }

    if (!authorization) {
      return new Response(
        JSON.stringify({ error: "Authentication is required" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const userClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    const stateResponse = await fetch(
      "https://api.sleeper.app/v1/state/nfl"
    );

    if (!stateResponse.ok) {
      throw new Error("Unable to retrieve the current NFL week");
    }

    const nflState = await stateResponse.json();
    const currentSeason = Number(nflState.season);
    const currentWeek = Number(nflState.week);

    const { data: predictions, error: predictionError } =
      await adminClient
        .from("ai_predictions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("predicted_at", { ascending: true });

    if (predictionError) {
      throw predictionError;
    }

    const eligiblePredictions = (predictions ?? []).filter(
      (prediction: any) =>
        prediction.season < currentSeason ||
        (
          prediction.season === currentSeason &&
          prediction.week < currentWeek
        )
    );

    const statsCache = new Map<
      string,
      Map<string, Record<string, number>>
    >();

    let playerDirectory: Record<string, any> | null = null;
    const results = [];

    for (const prediction of eligiblePredictions) {
      const cacheKey = `${prediction.season}-${prediction.week}`;

      if (!statsCache.has(cacheKey)) {
        const rows = await fetchWeekStats(
          prediction.season,
          prediction.week
        );

        statsCache.set(cacheKey, createStatsMap(rows));
      }

      const statsMap = statsCache.get(cacheKey)!;
      const candidates: Candidate[] =
        Array.isArray(prediction.candidates)
          ? prediction.candidates
          : [];

      const actualResults = [];
      let hasMissingPlayer = false;

      for (const candidate of candidates) {
        let playerId = candidate.playerId?.trim() || null;

        if (!playerId) {
          if (!playerDirectory) {
            playerDirectory = await fetchPlayerDirectory();
          }

          playerId = findPlayerIdByName(
            candidate.name,
            playerDirectory
          );
        }

        const stats = playerId
          ? statsMap.get(String(playerId))
          : undefined;

        if (!playerId || !stats) {
          hasMissingPlayer = true;

          actualResults.push({
            playerId,
            name: candidate.name,
            position: candidate.position ?? null,
            projection: candidate.projection ?? null,
            actualPoints: null,
            statsAvailable: false,
          });

          continue;
        }

        actualResults.push({
          playerId,
          name: candidate.name,
          position: candidate.position ?? null,
          projection: candidate.projection ?? null,
          actualPoints: calculateFantasyPoints(
            stats,
            prediction.scoring_format
          ),
          statsAvailable: true,
          stats,
        });
      }

      if (
        candidates.length < 2 ||
        hasMissingPlayer
      ) {
        const { error } = await adminClient
          .from("ai_predictions")
          .update({
            status: "void",
            actual_results: actualResults,
            correct: null,
            graded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", prediction.id);

        if (error) throw error;

        results.push({
          id: prediction.id,
          status: "void",
          reason:
            "One or more candidates had no final stats.",
        });

        continue;
      }

      const recommendedResult = actualResults.find(
        (result: any) =>
          (
            prediction.recommended_player_id &&
            result.playerId ===
              prediction.recommended_player_id
          ) ||
          normalizeName(result.name) ===
            normalizeName(
              prediction.recommended_player_name
            )
      );

      if (!recommendedResult) {
        throw new Error(
          `Recommended player was not found for prediction ${prediction.id}`
        );
      }

      const otherResults = actualResults.filter(
        (result: any) =>
          result !== recommendedResult
      );

      const highestOtherScore = Math.max(
        ...otherResults.map(
          (result: any) => result.actualPoints
        )
      );

      let status = "graded";
      let correct: boolean | null =
        recommendedResult.actualPoints >
        highestOtherScore;

      if (
        recommendedResult.actualPoints ===
        highestOtherScore
      ) {
        status = "tie";
        correct = null;
      }

      const { error: updateError } =
        await adminClient
          .from("ai_predictions")
          .update({
            status,
            actual_results: actualResults,
            correct,
            graded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", prediction.id);

      if (updateError) {
        throw updateError;
      }

      results.push({
        id: prediction.id,
        status,
        correct,
        recommendedPlayer:
          prediction.recommended_player_name,
        recommendedPoints:
          recommendedResult.actualPoints,
        highestAlternativePoints:
          highestOtherScore,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        currentSeason,
        currentWeek,
        pendingPredictions:
          predictions?.length ?? 0,
        eligiblePredictions:
          eligiblePredictions.length,
        gradedPredictions:
          results.length,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "Prediction grading error:",
      error instanceof Error
        ? error.message
        : error
    );

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Unknown grading error",
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