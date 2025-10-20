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

export async function getLeaderboard(batch: string, limit = 50) {
  const b = (batch ?? '').toString().trim().toUpperCase();
  if (!b) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('username, xp, batch')
    .eq('batch', b)
    .order('xp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getLeaderboard failed:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}
