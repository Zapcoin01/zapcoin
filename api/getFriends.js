// api/getFriends.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('referrals')
      .select(`
        referee_id,
        profiles:profiles!inner (username)
      `)
      .eq('referrer_id', userId);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database query failed', details: error.message });
    }

    const friends = data.map(item => ({
      id: item.referee_id,
      username: item.profiles?.username || 'Unknown'
    }));

    return res.status(200).json({ friends });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}