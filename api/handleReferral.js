// src/pages/api/handleReferral.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,             // ✅ service env var
  process.env.SUPABASE_SERVICE_ROLE_KEY // ✅ service role key
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { referrerId, refereeId, refereeUsername } = req.body;

  if (!referrerId || !refereeId || !refereeUsername) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Insert or update referee
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          tg_id: refereeId,
          username: refereeUsername
        },
        { onConflict: 'tg_id' }
      );

    if (profileError) throw profileError;

    // 2. Check if referral already exists
    const { data: existing, error: existingError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('referee_id', refereeId)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return res.status(200).json({ success: true, message: 'Already referred' });
    }

    // 3. Insert referral
    const { error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referee_id: refereeId
      });

    if (referralError) throw referralError;

    // 4. Reward referrer
    const { data: referrer, error: fetchError } = await supabase
      .from('profiles')
      .select('coins')
      .eq('tg_id', referrerId)
      .single();

    if (fetchError || !referrer) {
      return res.status(404).json({ error: 'Referrer not found' });
    }

    const newCoinCount = referrer.coins + 10000;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ coins: newCoinCount })
      .eq('tg_id', referrerId);

    if (updateError) throw updateError;

    // 5. Log transaction
    await supabase.from('transactions').insert({
      tg_id: referrerId,
      amount: 10000,
      reason: 'referral_reward',
      meta: { referee_id: refereeId }
    });

    return res.status(200).json({
      success: true,
      reward: 10000,
      referrerNewCoins: newCoinCount
    });
  } catch (error) {
    console.error('Referral handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
