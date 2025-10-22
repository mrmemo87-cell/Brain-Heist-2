// src/lib/db.ts
import { supabase } from '@/lib/supabase';

export async function upsertProfile(args: { username: string; batch: string; xp?: number }) {
  const username = (args.username ?? '').trim();
  const batch = (args.batch ?? '').trim().toUpperCase();
  const xp = Number.isFinite(args.xp) ? Number(args.xp) : 0;
  if (!username || !batch) return null;

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ username, batch, xp }, { onConflict: 'username' })
    .select()
    .single();

  if (error) { console.error('upsertProfile failed:', error); return null; }
  return data ?? null;
}

export async function saveStats(full: {
  username: string; batch: string;
  xp: number; creds: number; hacking: number; security: number;
  stamina_current: number; stamina_max: number; bio: string;
}) {
  const { error } = await supabase.rpc('rpc_save_stats', {
    p_username: full.username,
    p_batch: full.batch,
    p_xp: full.xp,
    p_creds: full.creds,
    p_hacking: full.hacking,
    p_security: full.security,
    p_stamina_current: full.stamina_current,
    p_stamina_max: full.stamina_max,
    p_bio: full.bio,
  });
  if (error) throw error;
}

export async function getLeaderboard(batch?: string, limit = 50) {
  const q = supabase.from('profiles')
    .select('username,batch,xp,creds,hacking,security,stamina_current,stamina_max,bio')
    .order('xp', { ascending: false })
    .limit(limit);
  const { data, error } = batch ? await q.eq('batch', batch) : await q;
  if (error) throw error;
  return data ?? [];
}

/** Pull N random questions by subject */
export async function getQuestions(subject: string, n = 5) {
  const { data, error } = await supabase
    .from('v_questions')
    .select('id,subject,prompt,options,correct_index')
    .eq('subject', subject)
    .order('id', { ascending: false }); // we’ll shuffle client-side
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  // shuffle + take n
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows.slice(0, n);
}
