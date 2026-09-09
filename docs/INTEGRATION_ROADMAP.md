# Integration Roadmap

This document tracks every major integration — what is REAL, what requires configuration, and what is NOT YET CONNECTED.

---

## REAL NOW

### Sleeper Active NFL Player Data
- **Service:** `src/services/sleeper/sleeperService.ts`
- **Mapper:** `src/services/sleeper/sleeperMapper.ts`
- **Cache:** `src/services/sleeper/sleeperCache.ts` (IndexedDB, 24h TTL)
- **Search:** `src/services/sleeper/playerSearch.ts`
- **Data source:** Sleeper API (`https://api.sleeper.app/v1/players/nfl`)

### Player Normalization
- **Mapper:** `src/services/sleeper/sleeperMapper.ts`
- Validates positions, NFL teams, handles D/ST, injury tags, free agents.

### Player Search
- **Service:** `src/services/sleeper/playerSearch.ts`
- **Component:** `src/components/fantasy/PlayerSearch.tsx`
- Case-insensitive partial name matching with ranking and keyboard navigation.

### Player Cache (IndexedDB)
- **Service:** `src/services/sleeper/sleeperCache.ts`
- 24-hour TTL, stale fallback, manual clear.

### Manual Roster Functionality
- **Service:** `src/services/team/manualTeamService.ts`
- **Component:** `src/components/fantasy/RosterBuilder.tsx`
- **Page:** My Team → Manual Team tab
- localStorage persistence, real player search, slot assignment.

### Manual League Settings
- **Service:** `src/services/team/manualTeamService.ts`
- **Component:** `src/components/fantasy/LeagueSettingsEditor.tsx`
- **Page:** League Settings (sidebar nav)

### FantasyPros Service Architecture
- **Edge Function:** `supabase/functions/fantasy-data/index.ts` (deployed)
- **Provider Client:** `src/services/providers/fantasyProsProvider.ts`
- **Provider-Neutral Service:** `src/services/fantasyData/fantasyDataService.ts`
- **Mapper:** `src/services/fantasyData/fantasyDataMapper.ts`
- **Cache:** `src/services/fantasyData/fantasyDataCache.ts`
- **Crosswalk:** `src/services/fantasyData/playerCrosswalk.ts`
- **Status:** Architecture is REAL and deployed. The edge function proxies requests to FantasyPros. The API key is the only missing piece (see CONFIGURATION REQUIRED below).

### Fantasy Scoring Engine
- **Service:** `src/services/fantasyData/scoringEngine.ts`
- **Status:** REAL — pure function `calculateFantasyPoints(stats, settings)`.
- Supports passing, rushing, receiving, fumbles, kickers, DST.
- Recalculates provider projections using user's actual league settings.

### Player ID Crosswalk
- **Service:** `src/services/fantasyData/playerCrosswalk.ts`
- **Status:** REAL — matches Sleeper IDs to FantasyPros IDs using name + team + position.
- Caches the mapping (24h TTL).

### Chat Tool Architecture
- **Definitions:** `src/services/ai/toolDefinitions.ts`
- **Implementations:** `src/services/ai/toolImplementations.ts`
- **Status:** 8 REAL tools (player_search, player_info, player_projection, player_recent_performance, player_rankings, player_injury, player_news, player_profile). 7 analysis tools gather real data context but return "reasoning engine not connected" since the AI model isn't connected.

### Upload Infrastructure
- **Service:** `src/services/upload/uploadService.ts`
- File type/size validation, typed `UploadedImage`.

---

## CONFIGURATION REQUIRED

### FantasyPros Server API Key
- **TODO marker:** `// TODO-INTEGRATION: FANTASYPROS_API`
- **Edge function:** `supabase/functions/fantasy-data/index.ts` (already deployed)
- **What to do:** Set the `FANTASYPROS_API_KEY` secret on the Supabase project.
- **How:** Use the Supabase dashboard (Project Settings → Edge Functions → Secrets) or CLI:
  ```
  supabase secrets set FANTASYPROS_API_KEY=your_key_here
  ```
- **Effect:** Once the key is set, all fantasy data functions (projections, rankings, injuries, news, performance) will return real data. The app automatically detects availability — no code changes needed.
- **Without the key:** The app builds and runs. Sleeper features work. FantasyPros features show "not connected" state.

---

## NOT YET CONNECTED

### Final AI Model
- **TODO marker:** `// TODO-INTEGRATION: AI_MODEL`
- **Mock file:** `src/services/ai/fantasyAiService.ts` (deterministic router, not an LLM)
- The tool registry is ready for the AI to call.

### Yahoo OAuth
- **TODO marker:** `// TODO-INTEGRATION: YAHOO_FANTASY`
- **Mock file:** `src/services/yahoo/yahooService.ts` (`IS_MOCK = true`)
- Clean adapter interfaces exist.

### ESPN Integration
- **TODO marker:** `// TODO-INTEGRATION: ESPN_FANTASY`
- **Mock file:** `src/services/fantasy/espnService.ts` (`IS_MOCK = true`)

### Screenshot Computer Vision
- **TODO marker:** `// TODO-INTEGRATION: ROSTER_SCREENSHOT_ANALYSIS`
- **Mock file:** `src/services/fantasy/rosterAnalysisService.ts`
- No OCR/vision connected. Chat now honestly reports this.

### Subjective Start/Sit Reasoning
- **TODO marker:** `// TODO-INTEGRATION: AI_MODEL`
- The start_sit tool gathers real projection + injury data, but the reasoning engine is not connected.

### Trade Reasoning
- **TODO marker:** `// TODO-INTEGRATION: TRADE_ENGINE`
- Real projection data is available as context; AI reasoning not connected.

### Waiver Reasoning
- **TODO marker:** `// TODO-INTEGRATION: WAIVER_AVAILABILITY + SLEEPER_ENGINE`

### Sleeper/Breakout Reasoning
- **TODO marker:** `// TODO-INTEGRATION: SLEEPER_ENGINE`

### Matchup Reasoning
- **TODO marker:** `// TODO-INTEGRATION: WEEKLY_MATCHUP_ANALYSIS`

### Authentication / Database Persistence
- **TODO marker:** `// TODO-INTEGRATION: AUTH_DATABASE_PERSISTENCE`
- **Mock file:** `src/services/auth/mockAuthService.ts`
- localStorage for chat + manual rosters.

---

## Data Flow Diagram (Current)

```
Sleeper API (https://api.sleeper.app/v1/players/nfl)
  |
  v
Sleeper Service (src/services/sleeper/sleeperService.ts)
  |
  v
IndexedDB Cache (24h TTL)
  |
  v
Sleeper Mapper (validates & normalizes)
  |
  v
Normalized Player objects
  |
  +---> Player Search
  +---> Roster Builder
  +---> AI Tools (player_search, player_info)


FantasyPros API (https://api.fantasypros.com/v2/json)
  ^
  |
Supabase Edge Function (supabase/functions/fantasy-data)
  |  (server-side API key: FANTASYPROS_API_KEY)
  |
  v
FantasyPros Provider Client (src/services/providers/fantasyProsProvider.ts)
  |
  v
Player Crosswalk (Sleeper ID <-> FantasyPros ID)
  |
  v
Fantasy Data Mapper (normalizes to shared types)
  |
  v
Fantasy Data Service (provider-neutral API)
  |
  +---> getWeeklyProjections()
  +---> getPlayerFantasyPoints()
  +---> getPlayerRanking()
  +---> getPlayerInjury()
  +---> getPlayerNews()
  +---> getPlayerFantasyProfile() (aggregator)
  +---> calculateFantasyPoints() (pure scoring engine)
  +---> AI Tools (player_projection, player_rankings, etc.)
```

## Intended Future Data Flow

```
Sleeper          FantasyPros (via edge function)
  |                    |
  +---- Player Identity Crosswalk ----+
                    |
                    v
         Normalized Fantasy Data
                    |
                    v
         League Scoring Engine
                    |
                    v
         Structured AI Tools
                    |
                    v
         AI Model (LLM with tool calling)
                    |
                    v
         Chat Response + Visual Cards
```

---

## Integration Details

### AI Model Integration
- **TODO marker:** `// TODO-INTEGRATION: AI_MODEL`
- **Tool registry:** `src/services/ai/toolImplementations.ts` (15 tools, 8 real)
- **Suggested steps:**
  1. Choose an LLM provider.
  2. Create a Supabase Edge Function to proxy LLM API calls.
  3. Register the 15 tools as function definitions.
  4. Let the model call tools and map results into ChatMessage cards.

### FantasyPros API Key
- **TODO marker:** `// TODO-INTEGRATION: FANTASYPROS_API`
- **Edge function:** Already deployed at `/functions/v1/fantasy-data`
- **Steps:** Set `FANTASYPROS_API_KEY` secret via Supabase dashboard or CLI.

### Yahoo Fantasy OAuth/API
- **TODO marker:** `// TODO-INTEGRATION: YAHOO_FANTASY`
- **Mock file:** `src/services/yahoo/yahooService.ts`
- **Adapter interfaces:** `connectYahoo`, `getYahooLeagues`, `getYahooRoster`, etc.

### ESPN Fantasy Integration
- **TODO marker:** `// TODO-INTEGRATION: ESPN_FANTASY`
- **Mock file:** `src/services/fantasy/espnService.ts`

### Authentication / Database Persistence
- **TODO marker:** `// TODO-INTEGRATION: AUTH_DATABASE_PERSISTENCE`
- Replace mock auth with Supabase auth, migrate localStorage to Supabase tables.

---

## Recommended Order After Bolt

1. **FantasyPros API key** — set the secret, all fantasy data activates
2. **AI model** — connect an LLM to the existing tool registry
3. **Core roster analysis** — combine projections + scoring engine + AI
4. **Yahoo Fantasy integration** — real OAuth via existing adapter
5. **Weekly matchup engine** — requires rosters + projections
6. **Sleeper engine** — requires waiver pool + projections + AI
7. **Trade engine** — requires all rosters + projections + AI
8. **ESPN integration** — secondary platform via existing adapter
9. **Screenshot roster recognition** — vision model for roster OCR
10. **Production authentication/persistence** — Supabase auth + database
