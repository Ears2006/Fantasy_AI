import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/state/AppContext';

interface AuthModalProps {
  open: boolean;
  mode: 'signin' | 'signup';
  onClose: () => void;
  onSwitchMode: (mode: 'signin' | 'signup') => void;
}

export function AuthModal({ open, mode, onClose, onSwitchMode }: AuthModalProps) {
  const { signIn, signUp } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onClose();
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-ink-600 bg-ink-850 p-6 shadow-2xl animate-fade-in">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-ink-750 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-neon-500/30 bg-ink-800">
            <span className="font-mono text-sm font-bold text-neon-500">FF</span>
          </div>
          <h2 className="text-lg font-bold text-white">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {mode === 'signin'
              ? 'Sign in to sync your league and save chats.'
              : 'Sign up to sync Yahoo Fantasy and unlock saved sessions.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-neon-500/40 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-neon-500/40 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-neon-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-neon-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neon-400 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => onSwitchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="font-medium text-neon-300 hover:text-neon-200"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <p className="mt-3 text-center text-[11px] text-gray-600">
          // TODO-INTEGRATION: AUTH_DATABASE_PERSISTENCE — mock auth for demo
        </p>
      </div>
    </div>
  );
}
