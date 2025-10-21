// src/lib/profile.ts
import { supabase } from '@/lib/supabase';
import type { Batch } from '@/types';

export async function claimProfile(username: string, batch: Batch) {
  const { data, error } = await supabase.rpc('rpc_claim_profile', {
    p_username: username,
    p_batch: batch,
  });
  if (error) throw error;
  return data; // [{ user_id, username, batch, xp }]
}
