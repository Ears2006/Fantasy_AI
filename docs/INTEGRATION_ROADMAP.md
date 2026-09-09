# Integration Roadmap

This document tracks every major integration that is currently mocked and needs a real implementation. Search the codebase for the `TODO-INTEGRATION` marker listed in each section to find the exact files and functions.

## How the mock layer is structured

The UI never talks to external APIs directly. Every integration goes through a service abstraction in `src/services/`. Each service file contains:

1. A `TODO-INTEGRATION` comment explaining what the real implementation should do, what input it receives, what output shape the UI expects, and which mock function it replaces.
2. A mock function that returns realistic data from `src/mock/data.ts`.

To implement a real integration, replace the body of the mock function while keeping the same function signature and return type. No UI components need to change.

---

## 1. AI Model Integration

**Integration name:** AI Model (LLM for fantasy analysis + chat)

**TODO-INTEGRATION marker:** `// TODO-INTEGRATION: AI_MODEL`

**Current mock file/function:**
- `src/services/ai/fantasyAiService.ts` — `generateFantasyResponse()`, `generatePostConnectionResponse()`, `detectIntent()`

**Expected input:**
- User text string
- Optional `ChatAttachment[]` (image data URLs)
- Chat history (future)
- League context: scoring settings, roster, matchup (future)

**Expected return type:**
- `ChatMessage[]` — one or more messages with `kind` set to `'assistant'`, `'roster-analysis'`, `'sleeper-recommendation'`, `'trade-analysis'`, `'matchup-analysis'`, or `'lineup-suggestion'`

**UI components that depend on it:**
- `src/pages/ChatPage.tsx`
- `src/components/chat/MessageBubble.tsx` (renders the returned messages)

**Suggested implementation steps:**
1. Choose an LLM provider (OpenAI, Anthropic, or hosted model).
2. Create a server-side edge function (Supabase Edge Function) that proxies the LLM API — never expose API keys in the browser.
3. Define a system prompt with fantasy football context and tool/function definitions for each fantasy sub-service (roster analysis, sleeper engine, trade engine, etc.).
4. Stream the response token-by-token into the chat for text messages.
5. For structured card responses, either let the model call function tools that return typed payloads, or parse the model's JSON output into the `ChatMessage` card payloads.

---

## 2. Screenshot / Vision Roster Recognition

**Integration name:** Roster Screenshot Analysis (OCR + vision)

**TODO-INTEGRATION marker:** `// TODO-INTEGRATION: ROSTER_SCREENSHOT_ANALYSIS`

**Current mock file/function:**
- `src/services/fantasy/rosterAnalysisService.ts` — `analyzeRosterScreenshot()`

**Expected input:**
- `ChatAttachment` (image data URL)
- Optional league scoring context

**Expected return type:**
- `UploadedRosterAnalysis` (defined in `src/types/index.ts`)

**UI components that depend on it:**
- `src/components/fantasy/RosterAnalysisCard.tsx`
- `src/components/fantasy/PlayerCard.tsx` (rendered inside roster analysis)

**Suggested implementation steps:**
1. Send the uploaded image to a vision-capable model (GPT-4o, Claude, or a custom OCR pipeline).
2. Extract roster rows: player name, position, NFL team, opponent, projected points.
3. Match extracted player names against the player stats provider (see section 3) to get player IDs and projections.
4. Compute projected team score, ceiling, biggest strength/weakness, and observations.
5. Return an `UploadedRosterAnalysis` object.

---

## 3. NFL / Player Statistics Provider

**Integration name:** Player Stats & Projections

**TODO-INTEGRATION marker:** `// TODO-INTEGRATION: PLAYER_STATS`

**Current mock file/function:**
- `src/services/fantasy/playerStatsService.ts` — `getPlayerStats()`, `getProjectedPlayers()`, `getPlayerProjection()`

**Expected input:**
- Player ID(s), optional week number

**Expected return type:**
- `Player` and `PlayerProjection` (defined in `src/types/index.ts`)

**UI components that depend on it:**
- All fantasy card components (PlayerCard, RosterAnalysisCard, LineupSuggestionCard, TeamOverviewCard, SleeperCard, TradeCard, MatchupCard)

**Suggested implementation steps:**
1. Choose a stats/projections provider (Sleeper API, FantasyData, or a custom scraping pipeline).
2. Create a server-side edge function that caches responses with a TTL.
3. Map provider payloads into the shared `Player` + `PlayerProjection` types.
4. Add a Supabase table for caching projections to reduce API calls.

---

## 4. Yahoo Fantasy OAuth/API

**Integration name:** Yahoo Fantasy Sports API

**TODO-INTEGRATION marker:** `// TODO-INTEGRATION: YAHOO_FANTASY`

**Current mock file/function:**
- `src/services/yahoo/yahooService.ts` — `connectYahooFantasy()`, `disconnectYahooFantasy()`, `getConnectionStatus()`

**Expected input:**
- None (triggers OAuth redirect) / callback token on return

**Expected return type:**
- `YahooConnection` (defined in `src/types/index.ts`)
- Future: `FantasyLeague`, `FantasyTeam`, `FantasyRoster` pulled from Yahoo

**UI components that depend on it:**
- `src/components/fantasy/YahooConnectCard.tsx`
- `src/components/layout/Sidebar.tsx` (connection status)
- `src/state/AppContext.tsx` (connection state)

**Suggested implementation steps:**
1. Register a Yahoo Developer app and get OAuth 2.0 credentials.
2. Implement the OAuth flow via a Supabase Edge Function (PKCE or server-side auth code flow).
3. Store refresh tokens securely in Supabase vault / edge function env vars.
4. Call Yahoo Fantasy API resources: game, league, team, roster, standings, matchups.
5. Map Yahoo payloads into `FantasyLeague` / `FantasyTeam` / `FantasyRoster` types.
6. Persist user league data in Supabase tables with RLS.

---

## 5. ESPN Fantasy Integration

**Integration name:** ESPN Fantasy API

**TODO-INTEGRATION marker:** `// TODO-INTEGRATION: ESPN_FANTASY`

**Current mock file/function:**
- `src/services/fantasy/espnService.ts` — `fetchEspnLeague()`

**Expected input:**
- League ID, optional season year

**Expected return type:**
- `FantasyLeague` (defined in `src/types/index.ts`)

**UI components that depend on it:**
- `src/pages/LeaguePage.tsx`
- `src/pages/MyTeamPage.tsx` (future)

**Suggested implementation steps:**
1. Implement ESPN Fantasy API auth (SWID + ESPN_S2 cookies for private leagues, public endpoint for public leagues).
2. Create an edge function to proxy requests and cache responses.
3. Map ESPN payloads into the shared types.
4. Add ESPN as a connection option alongside Yahoo in the sidebar and settings.

---

## 6. Sleeper Recommendation Engine

**Integration name:** Sleeper Engine

**TODO-INTEGRATION marker:** `// TODO-INTEGRATION: SLEEPER_ENGINE`

**Current mock file/function:**
- `src/services/fantasy/sleeperService.ts` — `findSleeperCandidates()`

**Expected input:**
- League ID, week, roster context, scoring settings

**Expected return type:**
- `SleeperRecommendation[]` (defined in `src/types/index.ts`)

**UI components that depend on it:**
- `src/components/fantasy/SleeperCard.tsx`

**Suggested implementation steps:**
1. Pull the waiver/free-agent pool (see section 8) and all rosters from the connected platform.
2. Score each candidate on opportunity (snap share, targets, carries), matchup (opponent EPA), and upside (red-zone / big-play rate).
3. Use the AI model to generate reasoning text and confidence scores.
4. Filter by recommendation type: Free Agent Target, Trade Target, Deep Sleeper, Buy Low, Sell High.

---

## 7. Trade Recommendation Engine

**Integration name:** Trade Engine

**TODO-INTEGRATION marker:** `// TODO-INTEGRATION: TRADE_ENGINE`

**Current mock file/function:**
- `src/services/fantasy/tradeService.ts` — `analyzeTrade()`, `buildBetterTrade()`

**Expected input:**
- User team ID, league ID, optional seed players to give/receive

**Expected return type:**
- `TradeAnalysis` (defined in `src/types/index.ts`)

**UI components that depend on it:**
- `src/components/fantasy/TradeCard.tsx`

**Suggested implementation steps:**
1. Pull all rosters in the league from the connected platform.
2. Identify each team's positional surpluses and needs.
3. Value every player using season-long + weekly projections (section 3).
4. Generate trade proposals that improve the user's expected weekly total while staying within a fairness band.
5. Estimate acceptance likelihood from roster need fit + value balance.
6. The "Build Better Trade" button calls `buildBetterTrade()` for a second-pass proposal.

---

## 8. Waiver Availability

**Integration name:** Waiver Wire / Free Agent Pool

**TODO-INTEGRATION marker:** `// TODO-INTEGRATION: WAIVER_AVAILABILITY`

**Current mock file/function:**
- `src/services/fantasy/waiverService.ts` — `getWaiverAvailablePlayers()`

**Expected input:**
- League ID, position filter, week

**Expected return type:**
- `Player[]` (defined in `src/types/index.ts`)

**UI components that depend on it:**
- `src/services/fantasy/sleeperService.ts` (feeds the sleeper engine)
- `src/components/fantasy/SleeperCard.tsx` (indirectly)

**Suggested implementation steps:**
1. Query the connected platform's free-agent / waiver pool.
2. Filter by position, bye week, and ownership percentage.
3. Return players the sleeper engine can score.

---

## 9. Weekly Matchup Analysis

**Integration name:** Weekly Matchup Engine

**TODO-INTEGRATION marker:** `// TODO-INTEGRATION: WEEKLY_MATCHUP_ANALYSIS`

**Current mock file/function:**
- `src/services/fantasy/matchupService.ts` — `analyzeWeeklyMatchup()`

**Expected input:**
- User team ID, opponent team ID, week, scoring settings

**Expected return type:**
- `WeeklyMatchup` (defined in `src/types/index.ts`)

**UI components that depend on it:**
- `src/components/fantasy/MatchupCard.tsx`

**Suggested implementation steps:**
1. Pull both rosters and scoring settings from the connected platform.
2. Run projections for every starter on both sides (section 3).
3. Calculate win probability via Monte Carlo simulation across projection variance.
4. Optimize the user's lineup and surface the best move + a risky upside move.
5. Generate matchup observations using the AI model.

---

## 10. Authentication / Database Persistence

**Integration name:** Auth + Chat Session Persistence

**TODO-INTEGRATION marker:** `// TODO-INTEGRATION: AUTH_DATABASE_PERSISTENCE`

**Current mock files/functions:**
- `src/services/auth/mockAuthService.ts` — `mockSignIn()`, `mockSignUp()`, `mockSignOut()`
- `src/services/chat/useChatStore.ts` — `useChatStore()` hook (uses localStorage)

**Expected input:**
- Email + password (sign in/up), session token (get session)

**Expected return type:**
- `MockUser` (defined in `src/types/index.ts`) — will become a Supabase auth user
- Chat sessions: `ChatSession[]` persisted to Supabase

**UI components that depend on it:**
- `src/state/AppContext.tsx`
- `src/components/auth/AuthModal.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/services/chat/useChatStore.ts`

**Suggested implementation steps:**
1. Replace mock auth functions with Supabase auth calls (`signInWithPassword`, `signUp`, `signOut`, `onAuthStateChange`).
2. Create a `chat_sessions` table in Supabase with RLS scoped to `auth.uid()`.
3. Replace localStorage persistence in `useChatStore` with Supabase queries.
4. Store Yahoo connection state + tokens in a secure table.

---

## Recommended Order After Bolt

Implement integrations in this order — each builds on the one before it:

1. **Player/stat data provider** — everything else depends on projections
2. **Screenshot roster recognition** — unblocks the core upload flow
3. **AI model** — powers all natural language analysis
4. **Core roster analysis** — combines stats + AI for roster breakdowns
5. **Yahoo Fantasy integration** — brings in real league/roster data
6. **Weekly matchup engine** — requires rosters + projections
7. **Sleeper engine** — requires waiver pool + projections + AI
8. **Trade engine** — requires all rosters + projections
9. **ESPN integration** — secondary platform, lower priority
10. **Production authentication/persistence** — move from mock auth + localStorage to Supabase
