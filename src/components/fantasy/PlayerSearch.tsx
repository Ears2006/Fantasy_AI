import { Loader2, Search, AlertCircle, Heart } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FantasyPosition, NFLTeam, Player } from '@/types';
import { searchPlayers, type PlayerSearchResult } from '@/services/sleeper/playerSearch';

interface PlayerSearchProps {
  onSelect: (player: Player) => void;
  positionFilter?: FantasyPosition | null;
  teamFilter?: NFLTeam | null;
  placeholder?: string;
  autoFocus?: boolean;
  excludeIds?: Set<string>;
}

const POSITION_FILTERS: { value: FantasyPosition | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'QB', label: 'QB' },
  { value: 'RB', label: 'RB' },
  { value: 'WR', label: 'WR' },
  { value: 'TE', label: 'TE' },
  { value: 'K', label: 'K' },
  { value: 'D/ST', label: 'D/ST' },
];

export function PlayerSearch({
  onSelect,
  positionFilter: initialFilter = null,
  teamFilter = null,
  placeholder = 'Search players by name...',
  autoFocus = false,
  excludeIds,
}: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState<FantasyPosition | null>(initialFilter);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    debounceRef.current = setTimeout(async () => {
      try {
        const searchResults = await searchPlayers({
          query,
          position: positionFilter,
          nflTeam: teamFilter,
          limit: 15,
        });
        setResults(searchResults);
        setHighlightIndex(-1);
      } catch {
        setError('Failed to search players. Check your connection.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, positionFilter, teamFilter]);

  // Close results on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showResults || results.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && highlightIndex >= 0) {
        e.preventDefault();
        const result = results[highlightIndex];
        if (result && (!excludeIds || !excludeIds.has(result.player.id))) {
          handleSelect(result.player);
        }
      } else if (e.key === 'Escape') {
        setShowResults(false);
      }
    },
    [showResults, results, highlightIndex, excludeIds],
  );

  const handleSelect = (player: Player) => {
    onSelect(player);
    setQuery('');
    setResults([]);
    setShowResults(false);
    setHighlightIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-850 px-3 py-2 transition-colors focus-within:border-neon-500/40">
        <Search className="h-4 w-4 shrink-0 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-neon-500" />}
      </div>

      {/* Position filter pills */}
      <div className="mt-2 flex flex-wrap gap-1">
        {POSITION_FILTERS.map((p) => (
          <button
            key={p.label}
            onClick={() => setPositionFilter(p.value)}
            className={`rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${
              positionFilter === p.value
                ? 'border-neon-500/40 bg-neon-500/10 text-neon-300'
                : 'border-ink-600 bg-ink-850 text-gray-500 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Results dropdown */}
      {showResults && (query.trim() || loading || error) && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-ink-600 bg-ink-850 shadow-xl">
          {error && (
            <div className="flex items-center gap-2 px-3 py-3 text-xs text-neon-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {!error && !loading && results.length === 0 && query.trim() && (
            <div className="px-3 py-3 text-xs text-gray-500">
              No players found for "{query}"
            </div>
          )}

          {!error && results.length > 0 && (
            <ul className="py-1">
              {results.map((r, i) => {
                const isExcluded = excludeIds?.has(r.player.id);
                return (
                  <li key={r.player.id}>
                    <button
                      onClick={() => !isExcluded && handleSelect(r.player)}
                      disabled={isExcluded}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        isExcluded
                          ? 'cursor-not-allowed opacity-40'
                          : highlightIndex === i
                            ? 'bg-ink-750'
                            : 'hover:bg-ink-800'
                      }`}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-ink-600 bg-ink-800 text-[10px] font-bold text-gray-400">
                        {r.player.position}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{r.player.name}</p>
                        <p className="text-xs text-gray-500">
                          {r.player.nflTeam}
                          {r.player.injuryTag && (
                            <span className="ml-1.5 text-amber-400">{r.player.injuryTag}</span>
                          )}
                        </p>
                      </div>
                      {isExcluded && (
                        <span className="text-[10px] text-gray-600">Added</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!error && loading && results.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-3 text-xs text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Unused import guard — Heart kept for future favorite-player feature
void Heart;
