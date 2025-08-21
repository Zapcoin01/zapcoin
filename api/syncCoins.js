// api/syncCoins.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, localCoins } = req.body;

  if (!userId || localCoins === undefined) {
    return res.status(400).json({ error: 'Missing userId or localCoins' });
  }

  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('coins')
      .eq('tg_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    const serverCoins = profile?.coins || 0;
    const newTotalCoins = serverCoins + parseInt(localCoins);

    // Only update if there's a change
    if (newTotalCoins !== serverCoins) {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          tg_id: userId,
          coins: newTotalCoins
        });

      if (updateError) {
        console.error('Error updating coins:', updateError);
        return res.status(500).json({ error: 'Failed to update coins' });
      }
    }

    return res.status(200).json({
      success: true,
      newTotalCoins,
      serverCoins,
      syncedCoins: newTotalCoins - serverCoins,
    });
  } catch (error) {
    console.error('Sync coins error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}