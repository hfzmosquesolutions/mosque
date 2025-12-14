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

// DELETE /api/khairat-contributions/[id]/receipts/[receiptId] - Delete a receipt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; receiptId: string }> }
) {
  try {
    const { id, receiptId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get receipt to check permissions and get file path
    const { data: receipt, error: receiptError } = await supabaseAdmin
      .from('khairat_payment_receipts')
      .select('*, contribution:khairat_contributions(id, contributor_id, mosque_id, status)')
      .eq('id', receiptId)
      .eq('contribution_id', id)
      .single();

    if (receiptError || !receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const contribution = receipt.contribution;
    const isOwner = receipt.uploaded_by === userId;
    const isContributionOwner = contribution.contributor_id === userId;
    
    if (!isOwner && !isContributionOwner) {
      // Check if user is mosque admin
      const { data: mosque } = await supabaseAdmin
        .from('mosques')
        .select('user_id')
        .eq('id', contribution.mosque_id)
        .single();

      if (mosque?.user_id !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    // Only allow deletion if contribution is still pending
    if (contribution.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot delete receipt. Contribution is no longer pending.' },
        { status: 400 }
      );
    }

    // Extract file path from URL
    const fileUrl = receipt.file_url;
    // Extract path from URL (format: https://...supabase.co/storage/v1/object/public/documents/payment-receipts/...)
    const filePathMatch = fileUrl.match(/\/documents\/(.+)$/);
    const filePath = filePathMatch ? filePathMatch[1] : null;

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('khairat_payment_receipts')
      .delete()
      .eq('id', receiptId);

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete receipt: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // Delete file from storage if path is available
    if (filePath) {
      await supabaseAdmin.storage
        .from('documents')
        .remove([filePath]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete receipt' },
      { status: 500 }
    );
  }
}

