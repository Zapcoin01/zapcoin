// src/pages/api/handleReferral.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { referrerId, refereeId, refereeUsername } = req.body;
  if (!referrerId || !refereeId || !refereeUsername) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1) Ensure referee profile exists / update username
    const { error: profErr } = await supabase
      .from('profiles')
      .upsert({ tg_id: refereeId, username: refereeUsername }, { onConflict: 'tg_id' });

    if (profErr) throw profErr;

    // 2) Prevent self-referral
    if (referrerId === refereeId) {
      return res.status(200).json({ success: false, message: 'Self-referral ignored' });
    }

    // 3) Check existing referral
    const { data: existing, error: existingErr } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('referee_id', refereeId)
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (existing) return res.status(200).json({ success: true, message: 'Already referred' });

    // 4) Ensure referrer profile exists (so we can reward even if they never opened the app)
    await supabase
      .from('profiles')
      .upsert({ tg_id: referrerId }, { onConflict: 'tg_id' });

    // 5) Insert referral
    const { error: insertErr } = await supabase
      .from('referrals')
      .insert({ referrer_id: referrerId, referee_id: refereeId });

    if (insertErr) throw insertErr;

    // 6) Increment referrer coins atomically: read -> update
    const { data: refData, error: fetchErr } = await supabase
      .from('profiles')
      .select('coins')
      .eq('tg_id', referrerId)
      .single();

    if (fetchErr) throw fetchErr;

    const reward = 10000;
    const newCoins = (refData?.coins || 0) + reward;

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ coins: newCoins })
      .eq('tg_id', referrerId);

    if (updateErr) throw updateErr;

    // 7) Log transaction
    await supabase.from('transactions').insert({
      tg_id: referrerId,
      amount: reward,
      reason: 'referral_reward',
      meta: { referee_id: refereeId }
    });

    return res.status(200).json({ success: true, reward, referrerNewCoins: newCoins });
  } catch (error) {
    console.error('Referral handler error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
