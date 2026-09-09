import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { LineupSuggestionCard } from '@/components/fantasy/LineupSuggestionCard';
import { MatchupCard } from '@/components/fantasy/MatchupCard';
import { PlayerCard } from '@/components/fantasy/PlayerCard';
import { RosterAnalysisCard } from '@/components/fantasy/RosterAnalysisCard';
import { SleeperList } from '@/components/fantasy/SleeperCard';
import { TeamOverviewCard } from '@/components/fantasy/TeamOverviewCard';
import { TradeCard } from '@/components/fantasy/TradeCard';

interface MessageBubbleProps {
  message: ChatMessage;
  onRosterAction?: (action: 'optimize' | 'upgrades' | 'sleepers' | 'trade') => void;
  onBuildBetterTrade?: () => void;
}

export function MessageBubble({ message, onRosterAction, onBuildBetterTrade }: MessageBubbleProps) {
  // Structured card messages — no bubble, full-width.
  if (message.kind !== 'user' && message.kind !== 'assistant') {
    return (
      <div className="flex animate-fade-in justify-start">
        <div className="w-full max-w-3xl">
          {message.kind === 'roster-analysis' && message.rosterAnalysis && (
            <RosterAnalysisCard analysis={message.rosterAnalysis} onAction={onRosterAction} />
          )}
          {message.kind === 'sleeper-recommendation' && message.sleepers && (
            <SleeperList sleepers={message.sleepers} />
          )}
          {message.kind === 'trade-analysis' && message.tradeAnalysis && (
            <TradeCard analysis={message.tradeAnalysis} onBuildBetter={onBuildBetterTrade} />
          )}
          {message.kind === 'matchup-analysis' && message.matchup && (
            <MatchupCard matchup={message.matchup} />
          )}
          {message.kind === 'lineup-suggestion' && message.lineupSuggestion && (
            <LineupSuggestionCard
              starters={message.lineupSuggestion.starters}
              bench={message.lineupSuggestion.bench}
              expectedTotal={message.lineupSuggestion.expectedTotal}
              notes={message.lineupSuggestion.notes}
              recommendations={message.playerRecommendations}
            />
          )}
          {message.kind === 'player-recommendation' && message.playerRecommendations && (
            <div className="grid gap-2 sm:grid-cols-2">
              {message.playerRecommendations.map((r) => (
                <PlayerCard
                  key={r.player.id}
                  name={r.player.name}
                  position={r.player.position}
                  nflTeam={r.player.nflTeam}
                  opponent={r.player.opponent}
                  projection={r.projection}
                  status={r.status}
                  recommendation={r.reason}
                />
              ))}
            </div>
          )}
          {message.kind === 'team-overview' && message.teamOverview && (
            <TeamOverviewCard team={message.teamOverview} />
          )}
        </div>
      </div>
    );
  }

  const isUser = message.kind === 'user';

  return (
    <div className={`flex animate-fade-in gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neon-500/30 bg-ink-850">
          <Bot className="h-4 w-4 text-neon-500" />
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-2xl ${isUser ? 'order-first' : ''}`}>
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={`mb-2 flex flex-wrap gap-2 ${isUser ? 'justify-end' : ''}`}>
            {message.attachments.map((a) => (
              <div key={a.id} className="overflow-hidden rounded-lg border border-ink-600">
                <img src={a.dataUrl} alt={a.name} className="max-h-48 w-auto object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Text */}
        {message.text && (
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              isUser
                ? 'rounded-br-md bg-neon-500 text-white'
                : 'rounded-bl-md border border-ink-600 bg-ink-850 text-gray-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Pending skeleton */}
        {message.pending && !message.text && (
          <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-ink-600 bg-ink-850 px-4 py-3">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-neon-500" />
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-neon-500" style={{ animationDelay: '0.2s' }} />
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-neon-500" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-700">
          <User className="h-4 w-4 text-gray-300" />
        </div>
      )}
    </div>
  );
}
