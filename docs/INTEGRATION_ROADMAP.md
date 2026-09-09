# Integration Roadmap

This document tracks every major integration — what is now REAL versus MOCK, where each lives, and the data flow architecture.

## REAL NOW

The following features use real data and are fully functional:

### Sleeper Active NFL Player Data
- **Status:** REAL
- **Service:** `src/services/sleeper/sleeperService.ts`
- **Mapper:** `src/services/sleeper/sleeperMapper.ts`
- **Cache:** `src/services/sleeper/sleeperCache.ts` (IndexedDB, 24h TTL)
- **Search:** `src/services/sleeper/playerSearch.ts`
- **Data source:** Sleeper API (`https://api.sleeper.app/v1/players/nfl`)
- **Details:** Fetches all active NFL players, validates positions and teams, maps into the shared `Player` type, caches in IndexedDB with automatic refresh. Falls back to stale cache if the API is unreachable.

### Player Normalization
- **Status:** REAL
- **Mapper:** `src/services/sleeper/sleeperMapper.ts`
- **Details:** Validates position strings against a known set before casting to `FantasyPosition`. Maps DEF/DST to D/ST. Validates NFL team abbreviations against the known set. Handles free agents safely (skips them). Builds injury tags from injury_status + injury_body_part.

### Player Search
- **Status:** REAL
- **Service:** `src/services/sleeper/playerSearch.ts`
- **Component:** `src/components/fantasy/PlayerSearch.tsx`
- **Details:** Case-insensitive partial name matching, position filter, NFL team filter. Ranks exact > prefix > partial matches. Excludes UI-only positions (FLEX, Bench). Debounced with loading/error/empty states and keyboard navigation.

### Player Cache (IndexedDB)
- **Status:** REAL
- **Service:** `src/services/sleeper/sleeperCache.ts`
- **Details:** Stores the full Sleeper player database in IndexedDB (not localStorage, which exceeded quota). 24-hour TTL. Automatic refresh when stale. Falls back to stale cache on API failure. Manual cache clear via `refreshPlayerCache()`.

### Manual Roster Functionality
- **Status:** REAL
- **Service:** `src/services/team/manualTeamService.ts`
- **Component:** `src/components/fantasy/RosterBuilder.tsx`
- **Page:** My Team page → Manual Team tab
- **Details:** Users can set a team name, search for real NFL players, add them to roster slots (QB/RB/WR/TE/FLEX/K/D/ST/Bench), remove players, move between starter/bench, and save locally. Prevents duplicate player entries. Persists to localStorage.

### Manual League Settings
- **Status:** REAL
- **Service:** `src/services/team/manualTeamService.ts`
- **Component:** `src/components/fantasy/LeagueSettingsEditor.tsx`
- **Page:** League Settings page (sidebar nav)
- **Details:** Configure league name, number of teams, scoring format presets (Standard/Half-PPR/Full-PPR/PPR), all scoring parameters (pass/rush/receive TDs, yards, receptions, INT, fumbles), roster slot counts (QB/RB/WR/TE/FLEX/Bench), kicker/defense toggles. Persists to localStorage.

### Chat Tool Architecture
- **Status:** REAL (framework ready, analysis tools not connected)
- **Definitions:** `src/services/ai/toolDefinitions.ts`
- **Implementations:** `src/services/ai/toolImplementations.ts`
- **Details:** Typed input/output contracts for 9 tools. `player_search` and `player_info` are REAL (call the Sleeper service). All analysis tools (start_sit, waiver, trade, sleeper, matchup, roster) return explicit "not-connected" status. The future AI model can call these without importing React components.

### Upload Infrastructure
- **Status:** REAL (file validation + preview, no OCR/vision)
- **Service:** `src/services/upload/uploadService.ts`
- **Details:** Validates file type (PNG/JPG/WEBP) and size (10MB max). Creates typed `UploadedImage` records. Used by both the chat upload button and the chat input attachment button.

---

## STILL MOCK / NOT CONNECTED

### Weekly Projections
- **TODO-INTEGRATION:** `PLAYER_PROJECTIONS`
- **Current:** `getPlayerProjection()` in `src/services/fantasy/playerStatsService.ts` returns a deterministic mock projection derived from a hash of the player ID.
- **Mock data:** `src/mock/data.ts` still contains hardcoded mock projections for demo analysis cards.

### Advanced Stats
- **TODO-INTEGRATION:** `PLAYER_STATS`
- **Current:** No real stats feed. Player identity is real (Sleeper), but season stats, snap counts, targets, and advanced metrics are not available.

### Yahoo OAuth
- **TODO-INTEGRATION:** `YAHOO_FANTASY`
- **Current:** `src/services/yahoo/yahooService.ts` — all functions return mock data. Clearly labeled `IS_MOCK = true`. Clean adapter interfaces exist (`connectYahoo`, `disconnectYahoo`, `getYahooLeagues`, `getYahooRoster`, `getYahooLeagueSettings`, `getYahooMatchup`, `getYahooLeagueTeams`).
- **No real OAuth flow is implemented.**

### ESPN
- **TODO-INTEGRATION:** `ESPN_FANTASY`
- **Current:** `src/services/fantasy/espnService.ts` — all functions return mock data or throw. Clean adapter interfaces exist (`connectEspn`, `getEspnLeagues`, `getEspnRoster`, etc.).
- **No real ESPN auth is attempted.**

### AI Model
- **TODO-INTEGRATION:** `AI_MODEL`
- **Current:** `src/services/ai/fantasyAiService.ts` uses a deterministic keyword router, not an LLM. Tool definitions and implementations are ready for the AI to call.

### Screenshot Analysis
- **TODO-INTEGRATION:** `ROSTER_SCREENSHOT_ANALYSIS`
- **TODO-INTEGRATION:** `WEEKLY_MATCHUP_ANALYSIS`
- **Current:** `src/services/fantasy/rosterAnalysisService.ts` returns mock roster data after a delay. No OCR or vision model is connected. Upload validation and preview are real.

### Trade Intelligence
- **TODO-INTEGRATION:** `TRADE_ENGINE`
- **Current:** `src/services/fantasy/tradeService.ts` returns mock trade analysis.

### Waiver Intelligence
- **TODO-INTEGRATION:** `WAIVER_AVAILABILITY`
- **Current:** `src/services/fantasy/waiverService.ts` returns mock waiver players.

### Sleeper/Breakout Intelligence
- **TODO-INTEGRATION:** `SLEEPER_ENGINE`
- **Current:** `src/services/fantasy/sleeperService.ts` (the fantasy analysis service, not the Sleeper data service) returns mock sleeper recommendations.

### Weekly Matchup Intelligence
- **TODO-INTEGRATION:** `WEEKLY_MATCHUP_ANALYSIS`
- **Current:** `src/services/fantasy/matchupService.ts` returns mock matchup data.

### Authentication / Database Persistence
- **TODO-INTEGRATION:** `AUTH_DATABASE_PERSISTENCE`
- **Current:** `src/services/auth/mockAuthService.ts` returns a mock user. Chat sessions and manual rosters use localStorage. No Supabase auth or database tables are used yet.

---

## Data Flow Diagram (Current)

```
Sleeper API (https://api.sleeper.app/v1/players/nfl)
  ↓
Sleeper Service (src/services/sleeper/sleeperService.ts)
  ↓
IndexedDB Cache (src/services/sleeper/sleeperCache.ts) — 24h TTL
  ↓
Sleeper Mapper (src/services/sleeper/sleeperMapper.ts) — validates & normalizes
  ↓
Normalized Player objects (src/types/index.ts)
  ↓
Player Search (src/services/sleeper/playerSearch.ts)
  ↓
PlayerSearch UI (src/components/fantasy/PlayerSearch.tsx)
  ↓
Roster Builder (src/components/fantasy/RosterBuilder.tsx)
  ↓
Manual Team Service (src/services/team/manualTeamService.ts) — localStorage
```

## Intended Future Data Flow

```
Stats Provider + Yahoo League Data + Sleeper Players
  ↓
Normalized Fantasy Data (shared types)
  ↓
Analysis Tools (src/services/ai/toolImplementations.ts)
  ↓
AI Model (LLM with tool/function calling)
  ↓
Chat Response + Visual Cards (src/components/fantasy/*)
```

---

## Integration Details

### 1. AI Model Integration
- **TODO marker:** `// TODO-INTEGRATION: AI_MODEL`
- **Mock file:** `src/services/ai/fantasyAiService.ts`
- **Tool definitions:** `src/services/ai/toolDefinitions.ts`
- **Tool implementations:** `src/services/ai/toolImplementations.ts`
- **Suggested steps:**
  1. Choose an LLM provider (OpenAI, Anthropic, hosted model).
  2. Create a Supabase Edge Function to proxy the LLM API.
  3. Register the tools from `toolImplementations.ts` as function definitions.
  4. Let the model decide which tools to call, then map results into `ChatMessage` card payloads.

### 2. Screenshot / Vision Roster Recognition
- **TODO marker:** `// TODO-INTEGRATION: ROSTER_SCREENSHOT_ANALYSIS`
- **Mock file:** `src/services/fantasy/rosterAnalysisService.ts`
- **Upload infrastructure (real):** `src/services/upload/uploadService.ts`
- **Suggested steps:**
  1. Send the uploaded image to a vision model.
  2. Extract roster rows and match against Sleeper player IDs.
  3. Return `UploadedRosterAnalysis`.

### 3. NFL / Player Statistics Provider
- **TODO marker:** `// TODO-INTEGRATION: PLAYER_STATS`
- **TODO marker:** `// TODO-INTEGRATION: PLAYER_PROJECTIONS`
- **Real (identity):** `src/services/sleeper/sleeperService.ts`
- **Mock (projections):** `src/services/fantasy/playerStatsService.ts` → `getPlayerProjection()`
- **Suggested steps:**
  1. Integrate a projections feed (Sleeper projections, FantasyData, etc.).
  2. Replace `getPlayerProjection()` with real data.
  3. Add weekly stats, snap counts, targets.

### 4. Yahoo Fantasy OAuth/API
- **TODO marker:** `// TODO-INTEGRATION: YAHOO_FANTASY`
- **Mock file:** `src/services/yahoo/yahooService.ts` (`IS_MOCK = true`)
- **Adapter interfaces:** `connectYahoo`, `disconnectYahoo`, `getYahooLeagues`, `getYahooRoster`, `getYahooLeagueSettings`, `getYahooMatchup`, `getYahooLeagueTeams`
- **Suggested steps:**
  1. Register a Yahoo Developer app.
  2. Implement OAuth via a Supabase Edge Function.
  3. Map Yahoo payloads into shared types via a `yahooMapper` module.

### 5. ESPN Fantasy Integration
- **TODO marker:** `// TODO-INTEGRATION: ESPN_FANTASY`
- **Mock file:** `src/services/fantasy/espnService.ts` (`IS_MOCK = true`)
- **Adapter interfaces:** `connectEspn`, `getEspnLeagues`, `getEspnRoster`, `getEspnLeagueSettings`, `getEspnMatchup`, `getEspnLeagueTeams`
- **Suggested steps:**
  1. Research current ESPN Fantasy API auth method.
  2. Implement auth via a Supabase Edge Function.
  3. Map ESPN payloads into shared types.

### 6. Sleeper Recommendation Engine
- **TODO marker:** `// TODO-INTEGRATION: SLEEPER_ENGINE`
- **Mock file:** `src/services/fantasy/sleeperService.ts` (analysis, not data)
- **Tool stub:** `sleeperTool` in `src/services/ai/toolImplementations.ts`

### 7. Trade Recommendation Engine
- **TODO marker:** `// TODO-INTEGRATION: TRADE_ENGINE`
- **Mock file:** `src/services/fantasy/tradeService.ts`
- **Tool stubs:** `tradeAnalysisTool`, `tradeBuilderTool`

### 8. Waiver Availability
- **TODO marker:** `// TODO-INTEGRATION: WAIVER_AVAILABILITY`
- **Mock file:** `src/services/fantasy/waiverService.ts`
- **Tool stub:** `waiverTool`

### 9. Weekly Matchup Analysis
- **TODO marker:** `// TODO-INTEGRATION: WEEKLY_MATCHUP_ANALYSIS`
- **Mock file:** `src/services/fantasy/matchupService.ts`
- **Tool stub:** `matchupTool`

### 10. Authentication / Database Persistence
- **TODO marker:** `// TODO-INTEGRATION: AUTH_DATABASE_PERSISTENCE`
- **Mock file:** `src/services/auth/mockAuthService.ts`
- **localStorage services:** `src/services/chat/useChatStore.ts`, `src/services/team/manualTeamService.ts`
- **Suggested steps:**
  1. Replace mock auth with Supabase auth.
  2. Migrate chat sessions and manual rosters to Supabase tables with RLS.
  3. Store Yahoo/ESPN tokens securely.

---

## Recommended Order After Bolt

1. **Player/stat data provider** — projections feed to replace mock `getPlayerProjection()`
2. **Screenshot roster recognition** — vision model for roster OCR
3. **AI model** — LLM with tool-calling using the existing tool registry
4. **Core roster analysis** — combine projections + AI for real roster breakdowns
5. **Yahoo Fantasy integration** — real OAuth + API via the existing adapter
6. **Weekly matchup engine** — requires rosters + projections
7. **Sleeper engine** — requires waiver pool + projections + AI
8. **Trade engine** — requires all rosters + projections
9. **ESPN integration** — secondary platform via the existing adapter
10. **Production authentication/persistence** — Supabase auth + database tables
