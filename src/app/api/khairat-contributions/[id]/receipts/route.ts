import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// GET /api/khairat-contributions/[id]/receipts - Get receipts for a contribution
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseAdmin = getSupabaseAdmin();

    const { data: receipts, error } = await supabaseAdmin
      .from('khairat_payment_receipts')
      .select('*')
      .eq('contribution_id', id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: receipts || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}

// POST /api/khairat-contributions/[id]/receipts - Upload receipt for a contribution
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Allowed types: JPEG, PNG, GIF, PDF' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify contribution exists
    const { data: contribution, error: contributionError } = await supabaseAdmin
      .from('khairat_contributions')
      .select('id, contributor_id, mosque_id, status')
      .eq('id', id)
      .single();

    if (contributionError || !contribution) {
      return NextResponse.json(
        { error: 'Contribution not found' },
        { status: 404 }
      );
    }

    // Check permissions
    // For authenticated users, check if they own the contribution or if it's anonymous
    // For anonymous users, only allow if contribution is also anonymous
    if (uploadedBy) {
      const isOwner = contribution.contributor_id === uploadedBy;
      const isAnonymous = contribution.contributor_id === null;
      
      if (!isOwner && !isAnonymous) {
        // Check if user is mosque admin
        const { data: mosque } = await supabaseAdmin
          .from('mosques')
          .select('user_id')
          .eq('id', contribution.mosque_id)
          .single();

        if (mosque?.user_id !== uploadedBy) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 403 }
          );
        }
      }
    } else {
      // Anonymous user can only upload if contribution is also anonymous
      if (contribution.contributor_id !== null) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `payment-receipts/${id}/${fileName}`;

    // Use the same storage bucket as claim documents
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Create receipt record
    const { data: receipt, error: receiptError } = await supabaseAdmin
      .from('khairat_payment_receipts')
      .insert({
        contribution_id: id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: uploadedBy || null,
      })
      .select()
      .single();

    if (receiptError) {
      // Try to delete uploaded file if database insert fails
      await supabaseAdmin.storage
        .from('khairat-documents')
        .remove([filePath]);

      return NextResponse.json(
        { error: `Failed to create receipt record: ${receiptError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: receipt });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to upload receipt' },
      { status: 500 }
    );
  }
}

