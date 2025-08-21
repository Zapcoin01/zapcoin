// Create new file: /api/registerUser.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId, username } = req.body;

  if (!userId || !username) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing userId or username' 
    });
  }

  try {
    console.log('Registering user:', userId, username);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine for new users
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error during user check' 
      });
    }

    if (existingUser) {
      console.log('User already exists:', existingUser);
      
      // Update username if it has changed
      if (existingUser.username !== username) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ username })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating username:', updateError);
        } else {
          console.log('Username updated successfully');
        }
      }

      return res.status(200).json({
        success: true,
        message: 'User already registered',
        user: existingUser
      });
    }

    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          user_id: userId,
          username: username,
          coins: 0,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating user:', insertError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create user',
        error: insertError.message 
      });
    }

    console.log('New user created successfully:', newUser);
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Unexpected error in registerUser:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}