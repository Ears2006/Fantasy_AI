import { supabase } from '@/lib/supabase';
import type { ManualLeague, ManualTeam } from '@/types';

async function getUserId(): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user.id;
}

export async function loadCloudManualLeague(): Promise<ManualLeague | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('manual_leagues')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    scoring: data.scoring,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  } as ManualLeague;
}

export async function loadCloudManualTeam(): Promise<ManualTeam | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('manual_teams')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    leagueId: data.league_id,
    roster: data.roster,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  } as ManualTeam;
}

export async function saveCloudManualLeague(
  league: ManualLeague,
): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from('manual_leagues').upsert(
    {
      id: league.id,
      user_id: userId,
      name: league.name,
      scoring: league.scoring,
      created_at: new Date(league.createdAt).toISOString(),
      updated_at: new Date(league.updatedAt).toISOString(),
    },
    {
      onConflict: 'user_id',
    },
  );

  if (error) throw error;
}

export async function saveCloudManualTeam(
  team: ManualTeam,
): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from('manual_teams').upsert(
    {
      id: team.id,
      user_id: userId,
      league_id: team.leagueId,
      name: team.name,
      roster: team.roster,
      created_at: new Date(team.createdAt).toISOString(),
      updated_at: new Date(team.updatedAt).toISOString(),
    },
    {
      onConflict: 'user_id',
    },
  );

  if (error) throw error;
}

export async function clearCloudManualData(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error: teamError } = await supabase
    .from('manual_teams')
    .delete()
    .eq('user_id', userId);

  if (teamError) throw teamError;

  const { error: leagueError } = await supabase
    .from('manual_leagues')
    .delete()
    .eq('user_id', userId);

  if (leagueError) throw leagueError;
}