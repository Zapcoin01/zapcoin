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
      .upsert({ 
        tg_id: refereeId, 
        username: refereeUsername,
        coins: 0 // Initialize with 0 coins for new users
      }, { 
        onConflict: 'tg_id',
        ignoreDuplicates: false 
      });

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

    // 4) Ensure referrer profile exists and get current balance
    const { data: referrerProfile, error: referrerErr } = await supabase
      .from('profiles')
      .select('coins')
      .eq('tg_id', referrerId)
      .maybeSingle();

    if (referrerErr) throw referrerErr;

    // If referrer doesn't exist, create profile
    if (!referrerProfile) {
      await supabase
        .from('profiles')
        .upsert({ 
          tg_id: referrerId, 
          coins: 0 
        }, { onConflict: 'tg_id' });
    }

    // 5) Insert referral record FIRST
    const { error: insertErr } = await supabase
      .from('referrals')
      .insert({ 
        referrer_id: referrerId, 
        referee_id: refereeId,
        created_at: new Date().toISOString()
      });

    if (insertErr) throw insertErr;

    // 6) Get the current coins before adding reward
    const { data: currentProfile, error: currentErr } = await supabase
      .from('profiles')
      .select('coins')
      .eq('tg_id', referrerId)
      .single();

    if (currentErr) throw currentErr;

    const currentCoins = currentProfile.coins || 0;
    const reward = 10000;
    const newTotalCoins = currentCoins + reward;

    // 7) Update referrer coins with the new total
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ 
        coins: newTotalCoins,
        updated_at: new Date().toISOString()
      })
      .eq('tg_id', referrerId);

    if (updateErr) throw updateErr;

    // 8) Log transaction for audit trail
    await supabase.from('transactions').insert({
      tg_id: referrerId,
      amount: reward,
      reason: 'referral_reward',
      meta: { 
        referee_id: refereeId,
        referee_username: refereeUsername,
        previous_balance: currentCoins,
        new_balance: newTotalCoins
      },
      created_at: new Date().toISOString()
    });

    console.log(`Referral processed: ${referrerId} referred ${refereeId}, earned ${reward} coins. New balance: ${newTotalCoins}`);

    // 9) Return detailed response for frontend
    return res.status(200).json({
      success: true,
      reward,
      referrerPreviousCoins: currentCoins,
      referrerNewCoins: newTotalCoins,
      refereeId,
      refereeUsername,
      message: 'Referral reward added successfully'
    });

  } catch (error) {
    console.error('Referral handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}