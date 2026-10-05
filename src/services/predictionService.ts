import { supabase } from '@/lib/supabase';

export interface GradingResult {
  id: string;
  status: 'graded' | 'tie' | 'void';
  correct?: boolean | null;
  recommendedPlayer?: string;
  recommendedPoints?: number;
  highestAlternativePoints?: number;
  reason?: string;
}

export interface GradingResponse {
  success: boolean;
  currentSeason: number;
  currentWeek: number;
  pendingPredictions: number;
  eligiblePredictions: number;
  gradedPredictions: number;
  results: GradingResult[];
}

export async function gradePendingPredictions(): Promise<GradingResponse> {
  const { data, error } = await supabase.functions.invoke(
    'grade-predictions',
    {
      body: {},
    }
  );

  if (error) {
    throw new Error(
      error.message || 'Failed to grade predictions'
    );
  }

  return data as GradingResponse;
}