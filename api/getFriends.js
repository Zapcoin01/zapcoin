// Replace your entire /api/getFriends.js with this:
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    // First, get all referrals for this user
    const { data: referrals, error: referralError } = await supabase
      .from('referrals')
      .select('referee_id')
      .eq('referrer_id', userId);

    if (referralError) {
      console.error('Referrals query error:', referralError);
      return res.status(500).json({
        error: 'Failed to fetch referrals',
        details: referralError.message
      });
    }

    // If no referrals, return empty friends list
    if (!referrals || referrals.length === 0) {
      return res.status(200).json({ friends: [] });
    }

    // Get the referee IDs
    const refereeIds = referrals.map(r => r.referee_id);

    // ✅ FIX: Get friend profiles from 'users' table (not 'profiles')
    const { data: users, error: usersError } = await supabase
      .from('users')  // ← Changed from 'profiles' to 'users'
      .select('user_id, username')  // ← Changed from 'tg_id' to 'user_id'
      .in('user_id', refereeIds);  // ← Changed from 'tg_id' to 'user_id'

    if (usersError) {
      console.error('Users query error:', usersError);
      return res.status(500).json({
        error: 'Failed to fetch friend profiles',
        details: usersError.message
      });
    }

    // Format the friends data
    const friends = users.map(user => ({
      id: user.user_id,  // ← Changed from user.tg_id to user.user_id
      username: user.username || `user_${user.user_id.slice(-6)}`  // ← Changed field reference
    }));

    return res.status(200).json({ friends });

  } catch (error) {
    console.error('Server error in getFriends:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}