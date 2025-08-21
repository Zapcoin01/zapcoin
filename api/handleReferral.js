// Replace your entire /api/handleReferral.js with this:
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
    // 1) ✅ FIX: Ensure referee exists in 'users' table (not 'profiles')
    const { error: userErr } = await supabase
      .from('users')  // ← Changed from 'profiles' to 'users'
      .upsert({ 
        user_id: refereeId,  // ← Changed from 'tg_id' to 'user_id'
        username: refereeUsername,
        coins: 0  // ✅ Ensure new users start with 0 coins (no bonus for being referred)
      }, { onConflict: 'user_id' });  // ← Changed conflict field

    if (userErr) throw userErr;

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

    // 4) ✅ FIX: Ensure referrer exists in 'users' table
    const { error: referrerErr } = await supabase
      .from('users')  // ← Changed from 'profiles' to 'users'
      .upsert({ 
        user_id: referrerId,  // ← Changed from 'tg_id' to 'user_id'
        coins: 0  // Default coins if referrer doesn't exist yet
      }, { onConflict: 'user_id' });  // ← Changed conflict field

    if (referrerErr) throw referrerErr;

    // 5) Insert referral record
    const { error: insertErr } = await supabase
      .from('referrals')
      .insert({ referrer_id: referrerId, referee_id: refereeId });

    if (insertErr) throw insertErr;

    // 6) ✅ FIX: Increment referrer coins from 'users' table
    const { data: refData, error: fetchErr } = await supabase
      .from('users')  // ← Changed from 'profiles' to 'users'
      .select('coins')
      .eq('user_id', referrerId)  // ← Changed from 'tg_id' to 'user_id'
      .single();

    if (fetchErr) throw fetchErr;

    const reward = 10000;  // Only referrer gets coins
    const newCoins = (refData?.coins || 0) + reward;

    const { error: updateErr } = await supabase
      .from('users')  // ← Changed from 'profiles' to 'users'
      .update({ coins: newCoins })
      .eq('user_id', referrerId);  // ← Changed from 'tg_id' to 'user_id'

    if (updateErr) throw updateErr;

    // 7) ✅ FIX: Log transaction (update field name if you have transactions table)
    const { error: transErr } = await supabase
      .from('transactions')
      .insert({
        user_id: referrerId,  // ← Changed from 'tg_id' to 'user_id' (update this if your transactions table uses different field name)
        amount: reward,
        reason: 'referral_reward',
        meta: { referee_id: refereeId }
      });

    // Don't fail the whole request if transaction logging fails
    if (transErr) {
      console.warn('Transaction logging failed:', transErr);
    }

    console.log(`Referral processed: ${referrerId} referred ${refereeId}, earned ${reward} coins`);
    
    return res.status(200).json({ 
      success: true, 
      reward, 
      referrerNewCoins: newCoins,
      message: 'Referral processed successfully'
    });

  } catch (error) {
    console.error('Referral handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}