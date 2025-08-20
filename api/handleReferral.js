// src/pages/api/handleReferral.js - IMPROVED VERSION
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { referrerId, refereeId, refereeUsername } = req.body;
  if (!referrerId || !refereeId || !refereeUsername) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 🔥 KEY FIX: Check if profile already exists and preserve better username
    const { data: existingProfile, error: checkErr } = await supabase
      .from('profiles')
      .select('username')
      .eq('tg_id', refereeId)
      .maybeSingle();

    if (checkErr) throw checkErr;

    // Only update username if we don't have one or if the new one is better
    let shouldUpdateUsername = true;
    if (existingProfile?.username && 
        !existingProfile.username.startsWith('user_') && 
        existingProfile.username !== 'Friend') {
      shouldUpdateUsername = false; // Keep the existing good username
    }

    // 1) Ensure referee profile exists / update username carefully
    const profileUpdate = { tg_id: refereeId };
    if (shouldUpdateUsername) {
      profileUpdate.username = refereeUsername;
    }

    const { error: profErr } = await supabase
      .from('profiles')
      .upsert(profileUpdate, { onConflict: 'tg_id' });

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

    // 4) Ensure referrer profile exists
    await supabase
      .from('profiles')
      .upsert({ tg_id: referrerId }, { onConflict: 'tg_id' });

    // 5) Insert referral
    const { error: insertErr } = await supabase
      .from('referrals')
      .insert({ referrer_id: referrerId, referee_id: refereeId });

    if (insertErr) throw insertErr;

    // 6) Increment referrer coins atomically
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