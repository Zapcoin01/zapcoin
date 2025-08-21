// Replace your entire /api/getProfile.js with this:
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    // ✅ FIX: Read from 'users' table (not 'profiles')
    const { data, error } = await supabase
      .from('users')  // ← Changed from 'profiles' to 'users'
      .select('user_id, username, coins')
      .eq('user_id', userId)  // ← Changed from 'tg_id' to 'user_id'
      .maybeSingle();

    if (error) throw error;
    
    // Format response to match what frontend expects
    const profile = data ? {
      tg_id: data.user_id,  // Map user_id back to tg_id for frontend compatibility
      username: data.username,
      coins: data.coins
    } : null;

    return res.status(200).json({ profile });
  } catch (error) {
    console.error('getProfile error', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}