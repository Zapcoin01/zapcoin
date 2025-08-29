// api/getFriends.js
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

    // Now get the profile information for these referees
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('tg_id, username')
      .in('tg_id', refereeIds);

    if (profileError) {
      console.error('Profiles query error:', profileError);
      return res.status(500).json({
        error: 'Failed to fetch friend profiles',
        details: profileError.message
      });
    }

    // Format the friends data
    const friends = profiles.map(profile => ({
      id: profile.tg_id,
      username: profile.username || `user_${profile.tg_id.slice(-6)}`
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