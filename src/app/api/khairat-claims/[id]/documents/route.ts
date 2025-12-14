import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/khairat-claims/[id]/documents - Get documents for a claim
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseAdmin = getSupabaseAdmin();

    const { data: documents, error } = await supabaseAdmin
      .from('khairat_claim_documents')
      .select(`
        *,
        uploaded_by_user:user_profiles!uploaded_by(
          id,
          full_name
        )
      `)
      .eq('claim_id', id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching claim documents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: documents
    });

  } catch (error) {
    console.error('Error in GET /api/khairat-claims/[id]/documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/khairat-claims/[id]/documents - Upload document for a claim
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // uploadedBy is optional for anonymous claims

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
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Allowed types: JPEG, PNG, GIF, PDF, DOC, DOCX, TXT' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify claim exists and user has permission
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('khairat_claims')
      .select('id, khairat_member_id, claimant_id, status')
      .eq('id', id)
      .single();

    if (claimError || !claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    // Check permissions
    // For anonymous claims (no claimant_id), allow upload if claim was just created
    // For logged-in users, check if they are the claimant, member, or admin
    let hasPermission = false;
    
    if (!claim.claimant_id) {
      // Anonymous claim - allow upload if no claimant_id (claim was just created)
      hasPermission = true;
    } else if (uploadedBy) {
      // Check if user is the claimant (primary check)
      const isClaimant = claim.claimant_id === uploadedBy;

      // Check if user is the member (via khairat_member_id)
      let isMember = false;
      
      if (claim.khairat_member_id) {
        const { data: khairatMember } = await supabaseAdmin
          .from('khairat_members')
          .select('user_id')
          .eq('id', claim.khairat_member_id)
          .single();
        
        isMember = khairatMember?.user_id === uploadedBy;
      }
      
      // Get user role to check if admin
      const { data: userProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('role')
        .eq('id', uploadedBy)
        .single();

      const isAdmin = userProfile?.role === 'admin';

      hasPermission = isClaimant || isMember || isAdmin;
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized to upload documents for this claim' },
        { status: 403 }
      );
    }

    // Only allow document uploads for pending or under_review claims
    if (!['pending', 'under_review'].includes(claim.status)) {
      return NextResponse.json(
        { error: 'Cannot upload documents for claims in current status' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `claim-documents/${id}/${fileName}`;

    // Upload file to Supabase Storage
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

    // Save document record to database
    const { data: document, error: dbError } = await supabaseAdmin
      .from('khairat_claim_documents')
      .insert({
        claim_id: id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: uploadedBy || null // Allow null for anonymous claims
      })
      .select(`
        *,
        uploaded_by_user:user_profiles!uploaded_by(
          id,
          full_name
        )
      `)
      .single();

    if (dbError) {
      console.error('Error saving document record:', dbError);
      // Try to clean up uploaded file
      await supabaseAdmin.storage
        .from('documents')
        .remove([filePath]);
      
      return NextResponse.json(
        { error: 'Failed to save document record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document,
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/khairat-claims/[id]/documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/khairat-claims/[id]/documents/[docId] - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get document and claim info
    const { data: document, error: docError } = await supabaseAdmin
      .from('khairat_claim_documents')
      .select(`
        *,
        claim:khairat_claims!claim_id(
          id,
          khairat_member_id,
          status
        )
      `)
      .eq('id', docId)
      .eq('claim_id', id)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check permissions - only via khairat_member_id
    let isMember = false;
    
    if (document.claim.khairat_member_id) {
      const { data: khairatMember } = await supabaseAdmin
        .from('khairat_members')
        .select('user_id')
        .eq('id', document.claim.khairat_member_id)
        .single();
      
      isMember = khairatMember?.user_id === userId;
    }
    const isUploader = document.uploaded_by === userId;
    
    // Get user role to check if admin
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    if (!isMember && !isUploader && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this document' },
        { status: 403 }
      );
    }

    // Only allow deletion for pending or under_review claims
    if (!['pending', 'under_review'].includes(document.claim.status)) {
      return NextResponse.json(
        { error: 'Cannot delete documents for claims in current status' },
        { status: 400 }
      );
    }

    // Extract file path from URL
    const url = new URL(document.file_url);
    const filePath = url.pathname.split('/').slice(-3).join('/'); // Get last 3 parts: documents/claim-documents/claim-id/filename

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('documents')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('khairat_claim_documents')
      .delete()
      .eq('id', docId);

    if (deleteError) {
      console.error('Error deleting document record:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/khairat-claims/[id]/documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
