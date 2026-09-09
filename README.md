# Fantasy Football AI

An AI-first fantasy football assistant. Instead of a traditional dashboard, the app opens directly into a full-screen chatbot where you ask questions, upload roster screenshots, and receive structured analysis as visual cards.

## Current Functionality

- **Chatbot interface** — ask about your team in natural language
- **Screenshot upload** — upload roster/matchup/waiver/trade screenshots for analysis
- **Roster analysis cards** — projected scores, strengths, weaknesses, player-by-player recommendations
- **Sleeper recommendations** — AI upside projections with confidence scores and reasoning
- **Trade analysis** — fairness scores, acceptance likelihood, "Build Better Trade" generator
- **Weekly matchup analysis** — win probability, best lineup moves, high-risk upside plays
- **Lineup optimization** — optimized starters with expected totals
- **Mock Yahoo Fantasy connection** — simulated league sync with post-connection recommendations
- **Mock authentication** — sign in / sign up / sign out (no real backend)
- **Sidebar** — new chat, recent sessions, navigation (My Team, League, Settings, About, How It Works)
- **Chat persistence** — sessions saved to localStorage
- **Responsive design** — works on desktop and mobile

## What Is Currently Mocked

All analysis uses mock data. No real AI model, stats provider, or fantasy platform integration is connected. Every mock is clearly labeled with `TODO-INTEGRATION` comments in the code.

**Mocked:**
- AI model responses
- Player stats and projections
- Roster screenshot analysis (no OCR/vision)
- Yahoo Fantasy OAuth and API
- ESPN Fantasy API
- Sleeper, trade, and matchup engines
- Waiver availability
- Authentication (mock user, no Supabase auth)
- Chat persistence (localStorage, no database)

## Architecture

```
src/
├── components/
│   ├── auth/          — AuthModal
│   ├── chat/          — ChatInput, MessageBubble, Welcome
│   ├── fantasy/       — Reusable analysis cards (PlayerCard, RosterAnalysisCard,
│   │                    SleeperCard, TradeCard, MatchupCard, LineupSuggestionCard,
│   │                    TeamOverviewCard, YahooConnectCard, StatusBadge, Card primitives)
│   └── layout/        — Sidebar, TopBar
├── mock/
│   └── data.ts        — Centralized mock data (players, teams, leagues, trades, sleepers)
├── pages/
│   ├── ChatPage.tsx
│   ├── MyTeamPage.tsx
│   ├── LeaguePage.tsx
│   ├── SettingsPage.tsx
│   ├── AboutPage.tsx
│   └── HowItWorksPage.tsx
├── services/
│   ├── ai/            — fantasyAiService (intent detection + response generation)
│   ├── auth/          — mockAuthService
│   ├── chat/          — useChatStore (chat state + localStorage)
│   ├── fantasy/       — rosterAnalysisService, playerStatsService, matchupService,
│   │                    sleeperService, tradeService, waiverService, espnService
│   ├── yahoo/         — yahooService
│   └── utils/         — uid
├── state/
│   └── AppContext.tsx — global app state (user, Yahoo connection, navigation)
├── types/
│   └── index.ts       — all shared domain types
└── App.tsx            — app shell with layout + page routing
```

## Where Future Integrations Live

Every integration point is marked with `// TODO-INTEGRATION: <NAME>` comments. Search the codebase for `TODO-INTEGRATION` to find them all.

See **[docs/INTEGRATION_ROADMAP.md](docs/INTEGRATION_ROADMAP.md)** for the full integration plan, including expected inputs, return types, dependent UI components, and suggested implementation steps for each integration.

### Quick reference

| Integration | TODO Marker | Service File |
|---|---|---|
| AI Model | `AI_MODEL` | `src/services/ai/fantasyAiService.ts` |
| Screenshot Analysis | `ROSTER_SCREENSHOT_ANALYSIS` | `src/services/fantasy/rosterAnalysisService.ts` |
| Player Stats | `PLAYER_STATS` | `src/services/fantasy/playerStatsService.ts` |
| Yahoo Fantasy | `YAHOO_FANTASY` | `src/services/yahoo/yahooService.ts` |
| ESPN Fantasy | `ESPN_FANTASY` | `src/services/fantasy/espnService.ts` |
| Sleeper Engine | `SLEEPER_ENGINE` | `src/services/fantasy/sleeperService.ts` |
| Trade Engine | `TRADE_ENGINE` | `src/services/fantasy/tradeService.ts` |
| Waiver Availability | `WAIVER_AVAILABILITY` | `src/services/fantasy/waiverService.ts` |
| Weekly Matchup | `WEEKLY_MATCHUP_ANALYSIS` | `src/services/fantasy/matchupService.ts` |
| Auth/Persistence | `AUTH_DATABASE_PERSISTENCE` | `src/services/auth/mockAuthService.ts` + `src/services/chat/useChatStore.ts` |

## Design System

- Dark charcoal background (`#08090b`) with subtle neon red accents (`#e63946`)
- Inter font for UI, JetBrains Mono for technical labels
- 8px spacing system, thin modern borders
- Responsive: mobile sidebar with backdrop, desktop persistent sidebar
- Subtle animations: fade-in messages, pulse loading states, hover transitions

## How to Run

```bash
npm install
npm run dev
```

The dev server runs automatically. Open the browser to see the app.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS 3
- lucide-react (icons)
- Supabase client (available, not yet used — ready for auth + persistence)
