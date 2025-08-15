// src/api/getFriends.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  try {
    // Get all referrals where this user is the referrer
    const { data, error } = await supabase
      .from('referrals')
      .select('referee_id, profiles(username)')
      .eq('referrer_id', userId);

    if (error) {
      throw error;
    }

    // Format the response
    const friends = data.map(item => ({
      id: item.referee_id,
      username: item.profiles?.username || 'Unknown'
    }));

    return res.status(200).json({ friends });
  } catch (error) {
    console.error('Error in getFriends:', error);
    return res.status(500).json({ error: 'Failed to load friends' });
  }
}