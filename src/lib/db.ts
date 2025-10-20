import { supabase } from './supabase';

export async function upsertProfile(args: { username: string; batch: string; xp?: number }) {
  let { username, batch, xp = 0 } = args;
  batch = batch.trim().toUpperCase();
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ username, batch, xp }, { onConflict: 'username' })
    .select();
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function getLeaderboard(batch: string, limit = 50) {
  batch = batch.trim().toUpperCase();
  const { data, error } = await supabase
    .from('profiles')
    .select('username, xp, batch')
    .eq('batch', batch)
    .order('xp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
