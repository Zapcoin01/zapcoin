// src/pages/api/getProfile.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('tg_id, username, coins')
      .eq('tg_id', userId)
      .maybeSingle();

    if (error) throw error;
    
    // ✅ FIX: Create user if doesn't exist
    if (!data) {
      const { data: newUser, error: createError } = await supabase
        .from('profiles')
        .insert({ tg_id: userId, username: `user_${userId.slice(-6)}`, coins: 0 })
        .select()
        .single();
        
      if (createError) throw createError;
      return res.status(200).json({ profile: newUser });
    }
    
    return res.status(200).json({ profile: data });
  } catch (error) {
    console.error('getProfile error', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}