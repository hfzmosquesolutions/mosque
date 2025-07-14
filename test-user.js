import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://joenlldgpqnwvnlvpuax.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZW5sbGRncHFud3ZubHZwdWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMTU1MDEsImV4cCI6MjA2Nzg5MTUwMX0.GafjaNwGzW6vvmO8L5ZDowoAB-AMA1eOW9uYN10GFco';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  try {
    console.log('Creating test user...');

    // Test user credentials
    const testEmail = 'test@mosque.com';
    const testPassword = 'testpassword123';
    const testName = 'Test User';

    // Create user
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
        },
      },
    });

    if (error) {
      console.error('Error creating user:', error);
      return;
    }

    console.log('Test user created successfully!');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('User ID:', data.user?.id);

    // Test login
    console.log('\nTesting login...');
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

    if (loginError) {
      console.error('Login error:', loginError);
      return;
    }

    console.log('Login successful!');
    console.log('User:', loginData.user?.email);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestUser();
