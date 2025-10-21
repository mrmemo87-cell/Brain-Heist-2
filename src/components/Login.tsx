// components/login.tsx
import React, { useState } from 'react';
import type { Batch } from '../types';
import { AVAILABLE_BATCHES } from '../../constants';
import { supabase } from '@/lib/supabase';

interface LoginProps {
  onLogin: (username: string, batch: Batch) => string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [batch, setBatch] = useState<Batch>(AVAILABLE_BATCHES[0]);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const shake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // 1) Ensure we have a Supabase session (anonymous is perfect for your UX)
      const { data: sessionCheck } = await supabase.auth.getSession();
      if (!sessionCheck.session) {
        const { error: anonErr } = await supabase.auth.signInAnonymously();
        if (anonErr) throw anonErr;
      }

      // 2) Claim (or just fetch) the profile for this username
      const { data: claimed, error: claimErr } = await supabase.rpc('rpc_claim_profile', {
        p_username: username.trim(),
      });
      if (claimErr) throw claimErr;

      // 3) Stamp/update the chosen batch on the claimed row (self-update allowed by RLS)
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!userRes.user) throw new Error('No active user after sign-in.');

      await supabase
        .from('profiles')
        .update({ batch })
        .eq('user_id', userRes.user.id);

      // 4) Continue your existing app flow
      const maybeError = onLogin(username.trim(), batch);
      if (maybeError) {
        setError(maybeError);
        shake();
        return;
      }
    } catch (err: any) {
      console.error('[login] auth/claim error:', err);
      setError(err?.message || 'Login failed. Try again.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (error) setError(null);
  };

  const handleSystemReset = () => {
    const isConfirmed = window.confirm(
      'Are you sure you want to perform a system reset? This will delete ALL saved players and game progress for this browser. This is intended for starting a fresh session with a new class.'
    );
    if (isConfirmed) {
      localStorage.removeItem('brain-heist-game-over');
      localStorage.removeItem('brain-heist-live-events');
      localStorage.removeItem('brain-heist-user');

      const userListJSON = localStorage.getItem('brain-heist-user-list');
      if (userListJSON) {
        const userIds: string[] = JSON.parse(userListJSON);
        userIds.forEach((id) => {
          localStorage.removeItem(`brain-heist-user-${id}`);
        });
      }
      localStorage.removeItem('brain-heist-user-list');

      window.location.reload();
    }
  };

  return (
    <div
      className={`w-full max-w-md hacker-box p-8 transition-transform duration-500 ${
        isShaking ? 'animate-shake-error' : ''
      } animate-fade-in`}
    >
      <div className="relative">
        <div className="terminal-scan-line"></div>
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold text-center text-green-400 mb-2 font-orbitron animate-text-glitch">
        BRAIN HEIST
      </h1>
      <p className="text-center text-cyan-300 mb-8">// Agent Authentication Required</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
            Agent Name:
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={handleUsernameChange}
            className="w-full hacker-input"
            placeholder="e.g. Cipher"
            required
          />
        </div>
        <div>
          <label htmlFor="batch" className="block text-sm font-medium text-gray-300 mb-2">
            Select Batch:
          </label>
          <select
            id="batch"
            value={batch}
            onChange={(e) => setBatch(e.target.value as Batch)}
            className="w-full hacker-input"
          >
            {AVAILABLE_BATCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <p className="text-red-400 text-sm text-center -my-3 p-2 bg-red-900/50 border border-red-500 rounded">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full font-bold text-lg py-3 hacker-button hacker-button-primary disabled:opacity-60"
        >
          {loading ? '> Linking Agent…' : '> Access Terminal'}
        </button>
      </form>
      <div className="text-center mt-6 border-t border-gray-700 pt-4">
        <button
          onClick={handleSystemReset}
          className="text-xs text-red-400 hover:text-red-300 hover:underline"
        >
          // System Reset
        </button>
      </div>
    </div>
  );
};

export default Login;
