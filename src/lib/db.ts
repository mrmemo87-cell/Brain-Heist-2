import { supabase } from '@/lib/supabase';

export async function upsertProfile(args: { username: string; batch: string; xp?: number }) {
  const username = (args.username ?? '').toString().trim();
  const batch = (args.batch ?? '').toString().trim().toUpperCase();
  const xp = Number.isFinite(args.xp) ? (args.xp as number) : 0;
  if (!username || !batch) return null;

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ username, batch, xp }, { onConflict: 'username' })
    .select();

  if (error) {
    console.error('upsertProfile failed:', error);
    return null;
  }
  return data?.[0] ?? null;
}

export async function getLeaderboard(batch?: string, limit = 50) {
  const { data, error } = await supabase.rpc('rpc_leaderboard_top', {
    p_batch: batch ?? null,
    p_limit: limit,
  });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

