import { useState } from 'react';
import { Check } from 'lucide-react';
import type { LeagueScoringSettings } from '@/types';
import { LeagueSettingsEditor, getDefaultScoring } from '@/components/fantasy/LeagueSettingsEditor';
import {
  loadManualLeague,
  saveManualLeague,
} from '@/services/team/manualTeamService';

export function LeagueSettingsPage() {
  const existing = loadManualLeague();
  const [savedNotice, setSavedNotice] = useState(false);

  const initialScoring: LeagueScoringSettings = existing?.scoring ?? getDefaultScoring();
  const initialName = existing?.name ?? 'My Fantasy League';

  const handleSave = (scoring: LeagueScoringSettings, name: string) => {
    saveManualLeague(scoring, name);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-white sm:text-2xl">League Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure your league scoring and roster slots. The analysis system will use these settings.
        </p>
      </div>

      {savedNotice && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300 animate-fade-in-quick">
          <Check className="h-4 w-4" />
          League settings saved.
        </div>
      )}

      <LeagueSettingsEditor initial={initialScoring} initialName={initialName} onSave={handleSave} />

      <p className="mt-4 text-center text-xs text-gray-600">
        Settings persist locally. They will sync to your account when authentication is connected.
      </p>
    </div>
  );
}
