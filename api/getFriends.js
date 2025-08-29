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
    console.log(`Getting friends for user: ${userId}`);
    
    // Enhanced query with better error handling and ordering
    const { data: referrals, error: referralError } = await supabase
      .from('referrals')
      .select('referee_id, created_at')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false }); // Get newest referrals first

    if (referralError) {
      console.error('Referrals query error:', referralError);
      return res.status(500).json({
        error: 'Failed to fetch referrals',
        details: referralError.message
      });
    }

    console.log(`Found ${referrals?.length || 0} referrals for user ${userId}`);

    // If no referrals, return empty friends list
    if (!referrals || referrals.length === 0) {
      return res.status(200).json({ 
        friends: [],
        message: 'No referrals found'
      });
    }

    // Get unique referee IDs (in case of duplicates)
    const refereeIds = [...new Set(referrals.map(r => r.referee_id))];
    console.log(`Unique referee IDs: ${refereeIds.join(', ')}`);

    // Get profile information for these referees with better error handling
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('tg_id, username, created_at')
      .in('tg_id', refereeIds)
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error('Profiles query error:', profileError);
      return res.status(500).json({
        error: 'Failed to fetch friend profiles',
        details: profileError.message
      });
    }

    console.log(`Found ${profiles?.length || 0} profiles`);

    // Create a map of referrals for easy lookup
    const referralMap = {};
    referrals.forEach(ref => {
      referralMap[ref.referee_id] = ref.created_at;
    });

    // Format the friends data with enhanced information
    const friends = profiles.map(profile => ({
      id: profile.tg_id,
      username: profile.username || `user_${profile.tg_id.slice(-6)}`,
      joinedAt: referralMap[profile.tg_id] || profile.created_at,
      reward: 10000 // Standard referral reward
    }));

    // Sort friends by join date (newest first)
    friends.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));

    console.log(`Returning ${friends.length} friends for user ${userId}`);

    return res.status(200).json({ 
      friends,
      totalReferrals: friends.length,
      totalRewards: friends.length * 10000
    });

  } catch (error) {
    console.error('Server error in getFriends:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}