import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Target,
  TrendingUp,
  Trophy,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { gradePendingPredictions } from '@/services/predictionService';

interface Candidate {
  name: string;
  playerId?: string;
  position?: string;
  projection?: number;
}

interface ActualResult {
  playerId: string | null;
  name: string;
  position: string | null;
  projection: number | null;
  actualPoints: number | null;
  statsAvailable: boolean;
}

interface Prediction {
  id: string;
  season: number;
  week: number;
  scoring_format: string | null;
  candidates: Candidate[];
  recommended_player_name: string;
  obvious_choice_player_name: string | null;
  is_contrarian: boolean;
  confidence: number | null;
  reasoning_summary: string | null;
  status: 'pending' | 'graded' | 'tie' | 'void';
  actual_results: ActualResult[] | null;
  correct: boolean | null;
  predicted_at: string;
  graded_at: string | null;
}

function formatPoints(points: number | null | undefined): string {
  return typeof points === 'number'
    ? points.toFixed(2)
    : '—';
}

function statusLabel(prediction: Prediction): string {
  if (prediction.status === 'pending') return 'Pending';
  if (prediction.status === 'void') return 'Void';
  if (prediction.status === 'tie') return 'Tie';
  return prediction.correct ? 'Correct' : 'Incorrect';
}

function StatusIcon({ prediction }: { prediction: Prediction }) {
  if (prediction.status === 'pending') {
    return <Clock3 className="h-5 w-5 text-amber-400" />;
  }

  if (prediction.status === 'void' || prediction.status === 'tie') {
    return <AlertCircle className="h-5 w-5 text-zinc-400" />;
  }

  if (prediction.correct) {
    return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
  }

  return <XCircle className="h-5 w-5 text-red-400" />;
}

export function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPredictions = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('ai_predictions')
      .select('*')
      .order('predicted_at', { ascending: false });

    if (queryError) {
      throw new Error(queryError.message);
    }

    setPredictions((data ?? []) as Prediction[]);
  }, []);

  const refreshAndGrade = useCallback(async () => {
    setError(null);
    setGrading(true);

    try {
      await gradePendingPredictions();
      await loadPredictions();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load prediction history'
      );
    } finally {
      setGrading(false);
      setLoading(false);
    }
  }, [loadPredictions]);

  useEffect(() => {
    refreshAndGrade();
  }, [refreshAndGrade]);

  const stats = useMemo(() => {
    const trackedPredictions = predictions.filter(
  (prediction) => prediction.status !== 'void'
);
    const completed = predictions.filter(
      (prediction) =>
        prediction.status === 'graded' &&
        prediction.correct !== null
    );

    const correct = completed.filter(
      (prediction) => prediction.correct === true
    );

    const contrarian = completed.filter(
      (prediction) => prediction.is_contrarian
    );

    const correctContrarian = contrarian.filter(
      (prediction) => prediction.correct === true
    );

    return {
      total: predictions.length,
      pending: predictions.filter(
        (prediction) => prediction.status === 'pending'
      ).length,
      completed: completed.length,
      correct: correct.length,
      accuracy:
        completed.length > 0
          ? Math.round((correct.length / completed.length) * 100)
          : null,
      contrarianTotal: contrarian.length,
      contrarianCorrect: correctContrarian.length,
      contrarianAccuracy:
        contrarian.length > 0
          ? Math.round(
              (correctContrarian.length / contrarian.length) * 100
            )
          : null,
    };
  }, [predictions]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <RefreshCw className="h-7 w-7 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            AI Accuracy
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track every recommendation and see how the AI performs.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshAndGrade}
          disabled={grading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${grading ? 'animate-spin' : ''}`}
          />
          {grading ? 'Checking results…' : 'Check results'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Target className="h-5 w-5 text-red-400" />}
          label="Recorded picks"
          value={String(stats.total)}
        />
        <StatCard
          icon={<Trophy className="h-5 w-5 text-emerald-400" />}
          label="Overall accuracy"
          value={
            stats.accuracy === null
              ? '—'
              : `${stats.accuracy}%`
          }
          detail={`${stats.correct} of ${stats.completed} graded`}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-violet-400" />}
          label="Contrarian accuracy"
          value={
            stats.contrarianAccuracy === null
              ? '—'
              : `${stats.contrarianAccuracy}%`
          }
          detail={`${stats.contrarianCorrect} of ${stats.contrarianTotal} graded`}
        />
        <StatCard
          icon={<Clock3 className="h-5 w-5 text-amber-400" />}
          label="Awaiting results"
          value={String(stats.pending)}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">
          Prediction history
        </h2>

        {predictions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <Target className="mx-auto h-9 w-9 text-zinc-600" />
            <p className="mt-3 font-medium text-zinc-300">
              No predictions recorded yet
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Ask the AI a start/sit question to create your first tracked pick.
            </p>
          </div>
        ) : (
          predictions.map((prediction) => (
            <PredictionCard
              key={prediction.id}
              prediction={prediction}
            />
          ))
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-3 text-3xl font-bold text-white">
        {value}
      </div>
      {detail && (
        <div className="mt-1 text-xs text-zinc-500">
          {detail}
        </div>
      )}
    </div>
  );
}

function PredictionCard({
  prediction,
}: {
  prediction: Prediction;
}) {
  const resultsByName = new Map(
    (prediction.actual_results ?? []).map((result) => [
      result.name,
      result,
    ])
  );

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {prediction.season} · Week {prediction.week}
            </span>

            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-zinc-400">
              {prediction.scoring_format ?? 'Standard'}
            </span>

            {prediction.is_contrarian && (
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-300">
                Contrarian pick
              </span>
            )}
          </div>

          <h3 className="mt-2 text-lg font-semibold text-white">
            Start {prediction.recommended_player_name}
          </h3>

          {prediction.obvious_choice_player_name && (
            <p className="mt-1 text-sm text-zinc-500">
              Obvious choice: {prediction.obvious_choice_player_name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-sm text-zinc-300">
          <StatusIcon prediction={prediction} />
          {statusLabel(prediction)}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {prediction.candidates.map((candidate) => {
          const result = resultsByName.get(candidate.name);
          const recommended =
            candidate.name ===
            prediction.recommended_player_name;

          return (
            <div
              key={`${prediction.id}-${candidate.name}`}
              className={`rounded-lg border p-3 ${
                recommended
                  ? 'border-red-500/30 bg-red-500/[0.07]'
                  : 'border-white/10 bg-black/10'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-zinc-200">
                    {candidate.name}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {candidate.position ?? 'Player'}
                    {recommended ? ' · AI pick' : ''}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold text-white">
                    {formatPoints(result?.actualPoints)}
                  </div>
                  <div className="text-xs text-zinc-500">
                    actual points
                  </div>
                </div>
              </div>

              <div className="mt-2 text-xs text-zinc-500">
                Projection: {formatPoints(candidate.projection)}
              </div>
            </div>
          );
        })}
      </div>

      {prediction.reasoning_summary && (
        <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-zinc-400">
          {prediction.reasoning_summary}
        </p>
      )}
    </article>
  );
}