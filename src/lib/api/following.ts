// Following System API Functions
// Handles user-to-user following and mosque-to-user following

import { supabase } from '../supabase';
import type { UserFollower, MosqueUserFollower } from '../../types/database';

// =============================================
// USER-TO-USER FOLLOWING
// =============================================

/**
 * Follow a user
 */
export async function followUser(followingId: string) {
  const { data, error } = await supabase
    .from('user_followers')
    .insert({
      follower_id: (await supabase.auth.getUser()).data.user?.id!,
      following_id: followingId,
      followed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to follow user: ${error.message}`);
  }

  return data;
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followingId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('user_followers')
    .delete()
    .eq('follower_id', user.user?.id!)
    .eq('following_id', followingId);

  if (error) {
    throw new Error(`Failed to unfollow user: ${error.message}`);
  }

  return true;
}

/**
 * Check if current user is following another user
 */
export async function isFollowingUser(followingId: string): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return false;

  const { data, error } = await supabase
    .from('user_followers')
    .select('id')
    .eq('follower_id', user.user.id)
    .eq('following_id', followingId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to check following status: ${error.message}`);
  }

  return !!data;
}

/**
 * Get users that the current user is following
 */
export async function getFollowing(page = 1, limit = 20) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('user_followers')
    .select(`
      id,
      followed_at,
      following_id
    `, { count: 'exact' })
    .eq('follower_id', user.user.id)
    .order('followed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to get following: ${error.message}`);
  }

  // Get user profiles for the following users
  const followingIds = data?.map(item => item.following_id) || [];
  let userProfiles: any[] = [];
  
  if (followingIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name, profile_picture_url, is_profile_private')
      .in('id', followingIds);
    
    if (profilesError) {
      throw new Error(`Failed to get user profiles: ${profilesError.message}`);
    }
    
    userProfiles = profiles || [];
  }

  // Combine the data
   const combinedData = data?.map(item => {
     const userProfile = userProfiles.find(profile => profile.id === item.following_id);
     return {
       ...item,
       user_profiles: userProfile
     };
   }) || [];
 
   return {
     data: combinedData,
    count: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
    has_next: (count || 0) > offset + limit,
    has_prev: page > 1
  };
}

/**
 * Get users that are following the current user
 */
export async function getFollowers(page = 1, limit = 20) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('user_followers')
    .select(`
      id,
      followed_at,
      follower_id
    `, { count: 'exact' })
    .eq('following_id', user.user.id)
    .order('followed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to get followers: ${error.message}`);
  }

  // Get user profiles for the follower users
  const followerIds = data?.map(item => item.follower_id) || [];
  let userProfiles: any[] = [];
  
  if (followerIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name, profile_picture_url, is_profile_private')
      .in('id', followerIds);
    
    if (profilesError) {
      throw new Error(`Failed to get user profiles: ${profilesError.message}`);
    }
    
    userProfiles = profiles || [];
  }

  // Combine the data
  const combinedData = data?.map(item => {
    const userProfile = userProfiles.find(profile => profile.id === item.follower_id);
    return {
      ...item,
      user_profiles: userProfile
    };
  }) || [];

  return {
    data: combinedData,
    count: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
    has_next: (count || 0) > offset + limit,
    has_prev: page > 1
  };
}

/**
 * Get follower and following counts for a user
 */
export async function getUserFollowStats(userId: string) {
  const [followersResult, followingResult] = await Promise.all([
    supabase.rpc('get_user_follower_count', { user_uuid: userId }),
    supabase.rpc('get_user_following_count', { user_uuid: userId })
  ]);

  if (followersResult.error) {
    throw new Error(`Failed to get follower count: ${followersResult.error.message}`);
  }

  if (followingResult.error) {
    throw new Error(`Failed to get following count: ${followingResult.error.message}`);
  }

  return {
    followers_count: followersResult.data || 0,
    following_count: followingResult.data || 0
  };
}

// =============================================
// MOSQUE-TO-USER FOLLOWING
// =============================================

/**
 * Mosque follows a user (requires mosque admin permissions)
 */
export async function mosqueFollowUser(mosqueId: string, userId: string) {
  const { data, error } = await supabase
    .from('mosque_user_followers')
    .insert({
      mosque_id: mosqueId,
      user_id: userId,
      followed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed for mosque to follow user: ${error.message}`);
  }

  return data;
}

/**
 * Mosque unfollows a user (requires mosque admin permissions)
 */
export async function mosqueUnfollowUser(mosqueId: string, userId: string) {
  const { error } = await supabase
    .from('mosque_user_followers')
    .delete()
    .eq('mosque_id', mosqueId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed for mosque to unfollow user: ${error.message}`);
  }

  return true;
}

/**
 * Check if a mosque is following a user
 */
export async function isMosqueFollowingUser(mosqueId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('mosque_user_followers')
    .select('id')
    .eq('mosque_id', mosqueId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to check mosque following status: ${error.message}`);
  }

  return !!data;
}

/**
 * Get users that a mosque is following
 */
export async function getMosqueFollowing(mosqueId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('mosque_user_followers')
    .select(`
      id,
      followed_at,
      user_id
    `, { count: 'exact' })
    .eq('mosque_id', mosqueId)
    .order('followed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to get mosque following: ${error.message}`);
  }

  // Get user profiles for the users
  const userIds = data?.map(item => item.user_id) || [];
  let userProfiles: any[] = [];
  
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name, profile_picture_url, is_profile_private')
      .in('id', userIds);
    
    if (profilesError) {
      throw new Error(`Failed to get user profiles: ${profilesError.message}`);
    }
    
    userProfiles = profiles || [];
  }

  // Combine the data
  const combinedData = data?.map(item => {
    const userProfile = userProfiles.find(profile => profile.id === item.user_id);
    return {
      ...item,
      user_profiles: userProfile
    };
  }) || [];

  return {
    data: combinedData,
    count: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
    has_next: (count || 0) > offset + limit,
    has_prev: page > 1
  };
}

/**
 * Get mosques that are following a user
 */
export async function getMosqueFollowers(userId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('mosque_user_followers')
    .select(`
      id,
      followed_at,
      mosque_id
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('followed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to get mosque followers: ${error.message}`);
  }

  // Get mosque data for the mosques
  const mosqueIds = data?.map(item => item.mosque_id) || [];
  let mosques: any[] = [];
  
  if (mosqueIds.length > 0) {
    const { data: mosqueData, error: mosqueError } = await supabase
      .from('mosques')
      .select('id, name, description, is_private')
      .in('id', mosqueIds);
    
    if (mosqueError) {
      throw new Error(`Failed to get mosque data: ${mosqueError.message}`);
    }
    
    mosques = mosqueData || [];
  }

  // Combine the data
  const combinedData = data?.map(item => {
    const mosque = mosques.find(m => m.id === item.mosque_id);
    return {
      ...item,
      mosques: mosque
    };
  }) || [];

  return {
    data: combinedData,
    count: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
    has_next: (count || 0) > offset + limit,
    has_prev: page > 1
  };
}

/**
 * Get following count for a mosque
 */
export async function getMosqueFollowingCount(mosqueId: string) {
  const { data, error } = await supabase
    .rpc('get_mosque_following_count', { mosque_uuid: mosqueId });

  if (error) {
    throw new Error(`Failed to get mosque following count: ${error.message}`);
  }

  return data || 0;
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Get comprehensive following stats for a user
 */
export async function getComprehensiveUserStats(userId: string) {
  const [userStats, mosqueFollowers] = await Promise.all([
    getUserFollowStats(userId),
    getMosqueFollowers(userId, 1, 1) // Just get count
  ]);

  return {
    ...userStats,
    mosque_followers_count: mosqueFollowers.count
  };
}

/**
 * Search users to follow (excluding already followed users)
 */
export async function searchUsersToFollow(query: string, page = 1, limit = 20) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const offset = (page - 1) * limit;

  // Get users that match the search query and are not already followed
  const { data, error, count } = await supabase
    .from('user_profiles')
    .select(`
      id,
      full_name,
      profile_picture_url,
      is_profile_private
    `, { count: 'exact' })
    .ilike('full_name', `%${query}%`)
    .neq('id', user.user.id) // Exclude current user
    .eq('is_profile_private', false) // Only show public profiles
    .order('full_name')
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to search users: ${error.message}`);
  }

  // Filter out already followed users
  const userIds = data?.map(u => u.id) || [];
  const { data: followingData } = await supabase
    .from('user_followers')
    .select('following_id')
    .eq('follower_id', user.user.id)
    .in('following_id', userIds);

  const followingIds = new Set(followingData?.map(f => f.following_id) || []);
  const filteredData = data?.filter(u => !followingIds.has(u.id)) || [];

  return {
    data: filteredData,
    count: filteredData.length,
    page,
    limit,
    total_pages: Math.ceil(filteredData.length / limit),
    has_next: filteredData.length === limit,
    has_prev: page > 1
  };
}