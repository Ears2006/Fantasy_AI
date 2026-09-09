// Yahoo-specific types for raw API response shapes.
// These are internal to the Yahoo provider — the rest of the app
// uses the provider-neutral types from @/types.

// ---- Raw Yahoo Fantasy API response shapes ----

export interface RawYahooLeague {
  league_key: string;
  league_id: string;
  name: string;
  url: string;
  logo_url?: string;
  draft_status: string;
  num_teams: number;
  edit_key: number;
  week: string;
  game_key: string;
  is_cash_league?: string;
  scoring_type: string;
  current_week: string;
  start_week: string;
  start_date: string;
  end_week: string;
  end_date: string;
  season: string;
  is_pro_league?: string;
  is_fifa?: string;
}

export interface RawYahooScoringCategory {
  stat_id: number;
  name: string;
  display_name: string;
  value: string | number;
  position_type: string;
  is_bonus?: string;
}

export interface RawYahooRosterPosition {
  position: string;
  position_type: string;
  count: number;
}

export interface RawYahooTeam {
  team_key: string;
  team_id: string;
  name: string;
  url?: string;
  team_logo?: string;
  waiver_priority?: number;
  number_of_moves?: number;
  number_of_trades?: number;
  roster_adds?: { coverage_type: string; coverage_value: string; value: string };
  managers: Array<{
    manager_id: string;
    nickname: string;
    guid: string;
    email?: string;
    is_commissioner?: string;
  }>;
  team_standings?: {
    rank: number;
    outcome_totals: { wins: number; losses: number; ties: number; percentage: string };
    streak: { type: string; value: string };
    points_against?: string;
    points_for?: string;
  };
}

export interface RawYahooPlayer {
  player_key: string;
  player_id: string;
  name: { full: string; first: string; last: string };
  editorial_team_abbr: string;
  editorial_team_full_name?: string;
  display_position: string;
  position_type: string;
  primary_position: string;
  eligible_positions?: string[];
  bye_weeks?: { week: string };
  status?: string;
  status_full?: string;
  injury_note?: string;
  on_disabled_list?: string;
  selected_position?: { position: string; is_flex?: string };
  headshot?: { url: string; size: string };
}

export interface RawYahooRosterPlayer extends RawYahooPlayer {
  selected_position: { position: string; is_flex?: string };
}

export interface RawYahooMatchup {
  week: string;
  status: string;
  is_second_half?: string;
  is_live?: string;
  is_tied?: string;
  winner_team_key?: string;
  teams: Array<{
    team_key: string;
    team_id: string;
    name: string;
    is_owner?: string;
    team_points?: { total: string; coverage_type?: string };
    team_projected_points?: { total: string; coverage_type?: string };
  }>;
}

// ---- Yahoo OAuth token response ----

export interface YahooTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  xoauth_yahoo_guid?: string;
}
