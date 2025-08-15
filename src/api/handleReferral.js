// src/pages/api/handleReferral.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { referrerId, refereeId, refereeUsername } = req.body;

  if (!referrerId || !refereeId || !refereeUsername) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  try {
    // 1. Insert or update the referee (new user)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        tg_id: refereeId,
        username: refereeUsername,
        coins: 0
      }, {
        onConflict: 'tg_id'
      });

    if (profileError) throw profileError;

    // 2. Check if this referral already exists
    const {  existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('referee_id', refereeId)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({ success: true, message: 'Already referred' });
    }

    // 3. Insert new referral
    const { error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referee_id: refereeId
      });

    if (referralError) throw referralError;

    // 4. Get current coins of referrer
    const {  referrer, error: fetchError } = await supabase
      .from('profiles')
      .select('coins')
      .eq('tg_id', referrerId)
      .single();

    if (fetchError || !referrer) {
      return res.status(404).json({ error: 'Referrer not found' });
    }

    // 5. Add 10,000 coins to referrer
    const newCoinCount = referrer.coins + 10000;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ coins: newCoinCount })
      .eq('tg_id', referrerId);

    if (updateError) throw updateError;

    // 6. Optional: Log transaction
    await supabase
      .from('transactions')
      .insert({
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