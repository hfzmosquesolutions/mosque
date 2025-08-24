// Legacy Records API Functions
// Handles legacy record operations with client-side authentication

import { supabase } from '../supabase';

export interface LegacyRecord {
  id: string;
  user_id: string;
  mosque_id: string;
  record_type: 'birth' | 'death' | 'marriage' | 'divorce' | 'other';
  record_data: any;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    phone?: string;
  };
  mosque?: {
    id: string;
    name: string;
  };
}

export interface LegacyRecordFilters {
  mosque_id?: string;
  user_id?: string;
  record_type?: string;
  page?: number;
  limit?: number;
}

/**
 * Get legacy records with filtering and pagination
 */
export async function getLegacyRecords(filters: LegacyRecordFilters = {}) {
  const { data: user } = await supabase.auth.getUser();
 
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const {
    mosque_id,
    user_id,
    record_type,
    page = 1,
    limit = 10
  } = filters;

  let query = supabase
    .from('legacy_records')
    .select(`
      *,
      user:user_profiles(id, full_name, phone),
      mosque:mosques(id, name)
    `)
    .order('created_at', { ascending: false });

  // If user_id is provided, get records for that user
  if (user_id) {
    // Users can only see their own records unless they're admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.user.id)
      .single();

    if (user.user.id !== user_id && userProfile?.role !== 'admin') {
      throw new Error('Forbidden: Cannot access other user records');
    }

    query = query.eq('user_id', user_id);
  }
  // If mosque_id is provided, get records for that mosque (admin only)
  else if (mosque_id) {
    // Check if user is admin of the mosque
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.user.id)
      .single();

    const { data: mosqueAdmin } = await supabase
      .from('mosques')
      .select('user_id')
      .eq('id', mosque_id)
      .single();

    if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user.user.id) {
      throw new Error('Forbidden: Not authorized to access mosque records');
    }

    query = query.eq('mosque_id', mosque_id);
  }
  // Otherwise, get user's own records
  else {
    query = query.eq('user_id', user.user.id);
  }

  // Apply record type filter
  if (record_type) {
    query = query.eq('record_type', record_type);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: records, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch legacy records: ${error.message}`);
  }

  return {
    records: records || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

/**
 * Create a new legacy record
 */
export async function createLegacyRecord(recordData: {
  mosque_id: string;
  record_type: 'birth' | 'death' | 'marriage' | 'divorce' | 'other';
  record_data: any;
}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { mosque_id, record_type, record_data } = recordData;

  if (!mosque_id || !record_type || !record_data) {
    throw new Error('Mosque ID, record type, and record data are required');
  }

  // Check if user is admin of the mosque
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', mosque_id)
    .single();

  if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user.user.id) {
    throw new Error('Forbidden: Not authorized to create records for this mosque');
  }

  // Create the record
  const { data: record, error } = await supabase
    .from('legacy_records')
    .insert({
      user_id: user.user.id,
      mosque_id,
      record_type,
      record_data
    })
    .select(`
      *,
      user:user_profiles(id, full_name, phone),
      mosque:mosques(id, name)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create legacy record: ${error.message}`);
  }

  return {
    message: 'Legacy record created successfully',
    record
  };
}

/**
 * Search legacy records
 */
export async function searchLegacyRecords(searchParams: {
  mosque_id: string;
  query: string;
  record_type?: string;
  page?: number;
  limit?: number;
}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const {
    mosque_id,
    query: searchQuery,
    record_type,
    page = 1,
    limit = 10
  } = searchParams;

  if (!mosque_id || !searchQuery) {
    throw new Error('Mosque ID and search query are required');
  }

  // Check if user is admin of the mosque
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', mosque_id)
    .single();

  if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user.user.id) {
    throw new Error('Forbidden: Not authorized to search records for this mosque');
  }

  let query = supabase
    .from('legacy_records')
    .select(`
      *,
      user:user_profiles(id, full_name, phone),
      mosque:mosques(id, name)
    `)
    .eq('mosque_id', mosque_id)
    .textSearch('record_data', searchQuery)
    .order('created_at', { ascending: false });

  // Apply record type filter
  if (record_type) {
    query = query.eq('record_type', record_type);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: records, error, count } = await query;

  if (error) {
    throw new Error(`Failed to search legacy records: ${error.message}`);
  }

  return {
    records: records || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

/**
 * Get combined history for legacy records
 */
export async function getCombinedHistory(params: {
  mosque_id: string;
  start_date?: string;
  end_date?: string;
  record_types?: string[];
  page?: number;
  limit?: number;
}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const {
    mosque_id,
    start_date,
    end_date,
    record_types,
    page = 1,
    limit = 10
  } = params;

  if (!mosque_id) {
    throw new Error('Mosque ID is required');
  }

  // Check if user is admin of the mosque
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', mosque_id)
    .single();

  if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user.user.id) {
    throw new Error('Forbidden: Not authorized to access mosque history');
  }

  let query = supabase
    .from('legacy_records')
    .select(`
      *,
      user:user_profiles(id, full_name, phone),
      mosque:mosques(id, name)
    `)
    .eq('mosque_id', mosque_id)
    .order('created_at', { ascending: false });

  // Apply date filters
  if (start_date) {
    query = query.gte('created_at', start_date);
  }
  if (end_date) {
    query = query.lte('created_at', end_date);
  }

  // Apply record type filter
  if (record_types && record_types.length > 0) {
    query = query.in('record_type', record_types);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: records, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get combined history: ${error.message}`);
  }

  return {
    records: records || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

/**
 * Match legacy records
 */
export async function matchLegacyRecords(matchData: {
  mosque_id: string;
  record_id: string;
  matched_record_id: string;
  match_type: string;
  confidence_score?: number;
  notes?: string;
}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const {
    mosque_id,
    record_id,
    matched_record_id,
    match_type,
    confidence_score,
    notes
  } = matchData;

  if (!mosque_id || !record_id || !matched_record_id || !match_type) {
    throw new Error('Mosque ID, record ID, matched record ID, and match type are required');
  }

  // Check if user is admin of the mosque
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', mosque_id)
    .single();

  if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user.user.id) {
    throw new Error('Forbidden: Not authorized to match records for this mosque');
  }

  // Create the match record
  const { data: match, error } = await supabase
    .from('legacy_record_matches')
    .insert({
      mosque_id,
      record_id,
      matched_record_id,
      match_type,
      confidence_score: confidence_score || 0.8,
      notes: notes || null,
      created_by: user.user.id
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create record match: ${error.message}`);
  }

  return {
    message: 'Records matched successfully',
    match
  };
}

/**
 * Delete a legacy record match
 */
export async function deleteLegacyRecordMatch(matchId: string, mosqueId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  if (!matchId || !mosqueId) {
    throw new Error('Match ID and Mosque ID are required');
  }

  // Check if user is admin of the mosque
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', mosqueId)
    .single();

  if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user.user.id) {
    throw new Error('Forbidden: Not authorized to delete matches for this mosque');
  }

  const { error } = await supabase
    .from('legacy_record_matches')
    .delete()
    .eq('id', matchId)
    .eq('mosque_id', mosqueId);

  if (error) {
    throw new Error(`Failed to delete record match: ${error.message}`);
  }

  return {
    message: 'Record match deleted successfully'
  };
}

/**
 * Create legacy khairat records
 */
export async function createLegacyKhairatRecords(data: {
  mosque_id: string;
  records: any[];
}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { mosque_id, records } = data;

  if (!mosque_id || !records || !Array.isArray(records)) {
    throw new Error('Mosque ID and records array are required');
  }

  // Check if user is admin of the mosque
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', mosque_id)
    .single();

  if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user.user.id) {
    throw new Error('Forbidden: Not authorized to create records for this mosque');
  }

  // Prepare records for insertion
  const recordsToInsert = records.map(record => {
    // Ensure payment_date is never null - use current date as fallback
    let paymentDate = new Date().toISOString().split('T')[0];
    if (record.payment_date && record.payment_date.trim()) {
      try {
        const parsedDate = new Date(record.payment_date);
        if (!isNaN(parsedDate.getTime())) {
          paymentDate = parsedDate.toISOString().split('T')[0];
        }
      } catch (error) {
        console.warn('Invalid date format, using current date:', record.payment_date);
      }
    }

    return {
      mosque_id,
      ic_passport_number: record.ic_passport_number,
      full_name: record.full_name,
      address_line1: record.address_line1 || null,
      address_line2: record.address_line2 || null,
      address_line3: record.address_line3 || null,
      payment_date: paymentDate,
      amount: record.amount ? parseFloat(record.amount) : 0,
      payment_method: record.payment_method || null,
      description: record.description || null,
      invoice_number: record.invoice_number || null,
      customer_po: record.customer_po || null,
      item_number: record.item_number || null,
      created_by: user.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  const { data: insertedRecords, error } = await supabase
    .from('legacy_khairat_records')
    .insert(recordsToInsert)
    .select();

  if (error) {
    throw new Error(`Failed to create legacy khairat records: ${error.message}`);
  }

  return {
    message: 'Legacy khairat records created successfully',
    count: insertedRecords?.length || 0,
    records: insertedRecords
  };
}

/**
 * Match legacy khairat records to users
 */
export async function matchLegacyKhairatRecords(data: {
  legacy_record_ids: string[];
  user_id: string;
}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { legacy_record_ids, user_id } = data;

  if (!legacy_record_ids || !Array.isArray(legacy_record_ids) || !user_id) {
    throw new Error('Legacy record IDs and user ID are required');
  }

  // Update the records to link them to the user
  const { data: updatedRecords, error } = await supabase
    .from('legacy_khairat_records')
    .update({ 
      matched_user_id: user_id,
      is_matched: true,
      updated_at: new Date().toISOString()
    })
    .in('id', legacy_record_ids)
    .select();

  if (error) {
    throw new Error(`Failed to match legacy records: ${error.message}`);
  }

  return {
    message: 'Legacy records matched successfully',
    records: updatedRecords
  };
}

/**
 * Unmatch legacy khairat records from users
 */
export async function unmatchLegacyKhairatRecords(data: {
  legacy_record_ids: string[];
}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { legacy_record_ids } = data;

  if (!legacy_record_ids || !Array.isArray(legacy_record_ids)) {
    throw new Error('Legacy record IDs are required');
  }

  // Update the records to unlink them from users
  const { data: updatedRecords, error } = await supabase
    .from('legacy_khairat_records')
    .update({ 
      matched_user_id: null,
      is_matched: false,
      updated_at: new Date().toISOString()
    })
    .in('id', legacy_record_ids)
    .select();

  if (error) {
    throw new Error(`Failed to unmatch legacy records: ${error.message}`);
  }

  return {
    message: 'Legacy records unmatched successfully',
    records: updatedRecords
  };
}

/**
 * Get legacy khairat records for a mosque
 */
export async function getLegacyKhairatRecords(filters: {
  mosque_id: string;
  page?: number;
  limit?: number;
  search?: string;
  match_filter?: 'all' | 'matched' | 'unmatched';
}) {
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const {
    mosque_id,
    page = 1,
    limit = 10,
    search,
    match_filter = 'all'
  } = filters;

  if (!mosque_id) {
    throw new Error('Mosque ID is required');
  }

  // Check if user is admin of the mosque
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();
   
  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', mosque_id)
    .single();
  
  if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user.user.id) {
    throw new Error('Forbidden: Not authorized to access mosque records');
  }

  let query = supabase
    .from('legacy_khairat_records')
    .select(`
      *,
      user:user_profiles!legacy_khairat_records_matched_user_id_fkey(id, full_name, phone)
    `, { count: 'exact' })
    .eq('mosque_id', mosque_id)
    .order('created_at', { ascending: false });

  // Apply search filter
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,ic_passport_number.ilike.%${search}%`);
  }

  // Apply match filter
  if (match_filter === 'matched') {
    query = query.not('matched_user_id', 'is', null);
  } else if (match_filter === 'unmatched') {
    query = query.is('matched_user_id', null);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: records, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch legacy khairat records: ${error.message}`);
  }

  return {
    records: records || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

/**
 * Get legacy records statistics for a mosque
 */
export async function getLegacyRecordStats(mosqueId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  if (!mosqueId) {
    throw new Error('Mosque ID is required');
  }

  // Check if user is admin of the mosque
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', mosqueId)
    .single();

  if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user.user.id) {
    throw new Error('Forbidden: Not authorized to access mosque statistics');
  }

  // Get total records count
  const { count: totalRecords } = await supabase
    .from('legacy_khairat_records')
    .select('*', { count: 'exact', head: true })
    .eq('mosque_id', mosqueId);

  // Get matched records count
  const { count: matchedRecords } = await supabase
    .from('legacy_khairat_records')
    .select('*', { count: 'exact', head: true })
    .eq('mosque_id', mosqueId)
    .or('is_matched.eq.true,matched_user_id.not.is.null');

  // Get total amount
  const { data: amountData } = await supabase
    .from('legacy_khairat_records')
    .select('amount, is_matched, matched_user_id')
    .eq('mosque_id', mosqueId);

  let totalAmount = 0;
  let matchedAmount = 0;

  if (amountData) {
    amountData.forEach(record => {
      const recordAmount = record.amount || 0;
      totalAmount += recordAmount;
      
      // If record is matched or has matched_user_id, it's matched
      if (record.is_matched || record.matched_user_id) {
        matchedAmount += recordAmount;
      }
    });
  }

  const unmatchedRecords = (totalRecords || 0) - (matchedRecords || 0);

  return {
    total_records: totalRecords || 0,
    matched_records: matchedRecords || 0,
    unmatched_records: unmatchedRecords,
    total_amount: totalAmount,
    matched_amount: matchedAmount
  };
}

/**
 * Find legacy khairat records by IC/Passport number for a specific mosque
 */
export async function findLegacyRecordsByIcPassport({
  mosque_id,
  ic_passport_number,
  page = 1,
  limit = 10
}: {
  mosque_id: string;
  ic_passport_number: string;
  page?: number;
  limit?: number;
}) {
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error('User not authenticated');
  }

  if (!mosque_id || !ic_passport_number) {
    throw new Error('Mosque ID and IC/Passport number are required');
  }

  // Check if user is admin of the mosque
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();
   
  const { data: mosqueAdmin } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', mosque_id)
    .single();
  
  if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user.user.id) {
    throw new Error('Forbidden: Not authorized to access mosque records');
  }

  // Search for legacy records with matching IC/Passport number
  let query = supabase
    .from('legacy_khairat_records')
    .select(`
      id,
      full_name,
      ic_passport_number,
      amount,
      payment_date,
      payment_method,
      description,
      invoice_number,
      is_matched,
      matched_user_id,
      created_at,
      updated_at
    `, { count: 'exact' })
    .eq('mosque_id', mosque_id)
    .ilike('ic_passport_number', `%${ic_passport_number}%`)
    .order('created_at', { ascending: false });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: records, error, count } = await query;

  if (error) {
    throw new Error(`Failed to find legacy records: ${error.message}`);
  }

  // Transform the data to include payment information
  const transformedRecords = (records || []).map(record => {
    return {
      id: record.id,
      full_name: record.full_name,
      ic_passport_number: record.ic_passport_number,
      total_amount: record.amount || 0,
      latest_payment_date: record.payment_date,
      status: (record.is_matched || record.matched_user_id ? 'matched' : 'unmatched') as 'matched' | 'unmatched',
      created_at: record.created_at,
      updated_at: record.updated_at
    };
  });

  return {
    records: transformedRecords,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}