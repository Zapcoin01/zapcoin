// src/pages/api/getProfile.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('tg_id, username, coins')
      .eq('tg_id', userId)
      .maybeSingle();

    if (error) throw error;
    return res.status(200).json({ profile: data || null });
  } catch (error) {
    console.error('getProfile error', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
