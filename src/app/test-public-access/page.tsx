'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile, Mosque } from '@/types/database';

type PublicProfile = Pick<UserProfile, 'id' | 'full_name' | 'is_profile_private' | 'created_at'>;
type PublicMosque = Pick<Mosque, 'id' | 'name' | 'is_private' | 'created_at'>;

export default function TestPublicAccessPage() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [mosques, setMosques] = useState<PublicMosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testPublicAccess();
  }, []);

  const testPublicAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test public access to user profiles (should work without authentication)
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, is_profile_private, created_at')
        .limit(5);

      if (profilesError) {
        console.error('Profiles error:', profilesError);
        setError(`Profiles error: ${profilesError.message}`);
      } else {
        setProfiles(profilesData || []);
        console.log('Public profiles loaded:', profilesData);
      }

      // Test public access to mosques (should work without authentication)
      const { data: mosquesData, error: mosquesError } = await supabase
        .from('mosques')
        .select('id, name, is_private, created_at')
        .limit(5);

      if (mosquesError) {
        console.error('Mosques error:', mosquesError);
        setError(prev => prev ? `${prev} | Mosques error: ${mosquesError.message}` : `Mosques error: ${mosquesError.message}`);
      } else {
        setMosques(mosquesData || []);
        console.log('Public mosques loaded:', mosquesData);
      }

    } catch (err) {
      console.error('Test error:', err);
      setError('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Testing Public Access</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Public Access Test Results</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Public User Profiles ({profiles.length})</h2>
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div key={profile.id} className="p-3 border rounded">
                <p><strong>Name:</strong> {profile.full_name}</p>
                <p><strong>Private:</strong> {profile.is_profile_private ? 'Yes' : 'No'}</p>
                <p><strong>Created:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
            ))}
            {profiles.length === 0 && (
              <p className="text-gray-500">No public profiles found</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Public Mosques ({mosques.length})</h2>
          <div className="space-y-2">
            {mosques.map((mosque) => (
              <div key={mosque.id} className="p-3 border rounded">
                <p><strong>Name:</strong> {mosque.name}</p>
                <p><strong>Private:</strong> {mosque.is_private ? 'Yes' : 'No'}</p>
                <p><strong>Created:</strong> {new Date(mosque.created_at).toLocaleDateString()}</p>
              </div>
            ))}
            {mosques.length === 0 && (
              <p className="text-gray-500">No public mosques found</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={testPublicAccess}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh Test
        </button>
      </div>
    </div>
  );
}