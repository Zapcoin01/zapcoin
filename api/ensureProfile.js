// pages/api/ensureProfile.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, username } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert(
  {
    tg_id: userId,
    username: username || `User_${userId.slice(-6)}`
    // 🚨 removed coins: 0 to avoid overwriting existing balance
  },
  { onConflict: 'tg_id', ignoreDuplicates: false }
);


    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Ensure profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}