// Test script to verify membership creation works
// Run this with: node test-membership-creation.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMembershipCreation() {
  console.log('Testing membership creation...');

  try {
    // First, let's check if we can connect to the database
    const { data: tables, error: tablesError } = await supabase
      .from('kariah_memberships')
      .select('count', { count: 'exact', head: true });

    if (tablesError) {
      console.error(
        'Error connecting to kariah_memberships table:',
        tablesError
      );
      return;
    }

    console.log('Current membership count:', tables);

    // Test inserting a membership record
    const testMembership = {
      user_id: '00000000-0000-0000-0000-000000000001', // Test UUID
      mosque_id: '00000000-0000-0000-0000-000000000001', // Test UUID
      status: 'active',
      joined_date: new Date().toISOString().split('T')[0],
      notes: 'Test membership creation',
    };

    console.log('Attempting to insert test membership:', testMembership);

    const { data: insertResult, error: insertError } = await supabase
      .from('kariah_memberships')
      .insert(testMembership)
      .select();

    if (insertError) {
      console.error('Error inserting membership:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('Membership inserted successfully:', insertResult);

      // Clean up - delete the test record
      if (insertResult && insertResult[0]) {
        const { error: deleteError } = await supabase
          .from('kariah_memberships')
          .delete()
          .eq('id', insertResult[0].id);

        if (deleteError) {
          console.error('Error cleaning up test record:', deleteError);
        } else {
          console.log('Test record cleaned up successfully');
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testMembershipCreation();
