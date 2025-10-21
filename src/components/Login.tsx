// src/components/Login.tsx
import React, { useState } from 'react';
import type { Batch } from '@/types';
import { AVAILABLE_BATCHES } from '@/constants';
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
      // Ensure we have a session (anonymous)
      const { data: sessionCheck } = await supabase.auth.getSession();
      if (!sessionCheck.session) {
        const { error: anonErr } = await supabase.auth.signInAnonymously();
        if (anonErr) throw anonErr;
      }

      // Insert-if-missing + claim + set batch (RPC must be updated as we discussed)
      const { error: claimErr } = await supabase.rpc('rpc_claim_profile', {
        p_username: username.trim(),
        p_batch: batch,
      });
      if (claimErr) throw claimErr;

      // Continue app flow
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

  return (
    <div className={`w-full max-w-md hacker-box p-8 transition-transform duration-500 ${isShaking ? 'animate-shake-error' : ''} animate-fade-in`}>
      <div className="relative"><div className="terminal-scan-line"></div></div>
      <h1 className="text-4xl sm:text-5xl font-bold text-center text-green-400 mb-2 font-orbitron animate-text-glitch">BRAIN HEIST</h1>
      <p className="text-center text-cyan-300 mb-8">// Agent Authentication Required</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">Agent Name:</label>
          <input id="username" value={username} onChange={(e) => { setUsername(e.target.value); if (error) setError(null); }} className="w-full hacker-input" placeholder="e.g. Cipher" required />
        </div>

        <div>
          <label htmlFor="batch" className="block text-sm font-medium text-gray-300 mb-2">Select Batch:</label>
          <select id="batch" value={batch} onChange={(e) => setBatch(e.target.value as Batch)} className="w-full hacker-input">
            {AVAILABLE_BATCHES.map((b) => (<option key={b} value={b}>{b}</option>))}
          </select>
        </div>

        {error && (<p className="text-red-400 text-sm text-center -my-3 p-2 bg-red-900/50 border border-red-500 rounded">{error}</p>)}

        <button type="submit" disabled={loading} className="w-full font-bold text-lg py-3 hacker-button hacker-button-primary disabled:opacity-60">
          {loading ? '> Linking Agent…' : '> Access Terminal'}
        </button>
      </form>

      <div className="text-center mt-6 border-t border-gray-700 pt-4">
        <button
          onClick={() => {
            if (!confirm('This will delete ALL saved players & progress in this browser. Continue?')) return;
            localStorage.removeItem('brain-heist-game-over');
            localStorage.removeItem('brain-heist-live-events');
            localStorage.removeItem('brain-heist-user');
            const list = localStorage.getItem('brain-heist-user-list');
            if (list) JSON.parse(list).forEach((id: string) => localStorage.removeItem(`brain-heist-user-${id}`));
            localStorage.removeItem('brain-heist-user-list');
            location.reload();
          }}
          className="text-xs text-red-400 hover:text-red-300 hover:underline"
        >
          // System Reset
        </button>
      </div>
    </div>
  );
};

export default Login;

