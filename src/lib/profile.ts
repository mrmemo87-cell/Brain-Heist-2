// src/lib/profile.ts
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth'; // or supabase.auth.getUser()

export async function claimProfile(username: string) {
  const { data: userRes, error: uErr } = await supabase.auth.getUser();
  if (uErr) throw uErr;
  if (!userRes.user) throw new Error('Not signed in');

  const { data, error } = await supabase.rpc('rpc_claim_profile', { p_username: username });
  if (error) throw error;
  return data; // [{ user_id, username, batch, xp }]
}
