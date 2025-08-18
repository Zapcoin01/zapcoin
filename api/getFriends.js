// src/pages/api/getFriends.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,             // ✅ service env var
  process.env.SUPABASE_SERVICE_ROLE_KEY // ✅ service role key
);

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        referee_id,
        referee_profile:profiles!referrals_referee_id_fkey(username)
      `)
      .eq('referrer_id', userId);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Database query failed',
        details: error.message
      });
    }

    const friends = data.map(item => ({
      id: item.referee_id,
      username: item.referee_profile?.username || 'Unknown'
    }));

    return res.status(200).json({ friends });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
