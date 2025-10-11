import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isUserMosqueAdmin } from '@/lib/api';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('organization_people')
      .select('*')
      .eq('id', params.id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching organization person:', error);
      return NextResponse.json(
        { error: 'Organization person not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/organization-people/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { full_name, position, department, email, phone, address, bio, profile_picture_url, is_public, start_date, end_date, is_active } = body;

    // Get the current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // First, get the organization person to check mosque_id and get current profile picture URL
    const { data: orgPerson, error: fetchError } = await supabaseAdmin
      .from('organization_people')
      .select('mosque_id, profile_picture_url')
      .eq('id', params.id)
      .single();

    if (fetchError || !orgPerson) {
      return NextResponse.json(
        { error: 'Organization person not found' },
        { status: 404 }
      );
    }

    // Check if user is admin of the mosque
    const isAdmin = await isUserMosqueAdmin(user.id, orgPerson.mosque_id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only mosque admins can update organization people' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (full_name && !full_name.trim()) {
      return NextResponse.json(
        { error: 'Full name cannot be empty' },
        { status: 400 }
      );
    }

    if (position && !position.trim()) {
      return NextResponse.json(
        { error: 'Position cannot be empty' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (position !== undefined) updateData.position = position;
    if (department !== undefined) updateData.department = department || null;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (address !== undefined) updateData.address = address || null;
    if (bio !== undefined) updateData.bio = bio || null;
    if (profile_picture_url !== undefined) updateData.profile_picture_url = profile_picture_url || null;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    // Handle date fields properly - only include if they have valid values
    if (start_date !== undefined) {
      updateData.start_date = start_date && start_date.trim() !== '' ? start_date : null;
    }
    if (end_date !== undefined) {
      updateData.end_date = end_date && end_date.trim() !== '' ? end_date : null;
    }

    const { data, error } = await supabaseAdmin
      .from('organization_people')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating organization person:', error);
      return NextResponse.json(
        { error: 'Failed to update organization person' },
        { status: 500 }
      );
    }

    // If profile picture was changed or removed, delete the old image from storage
    if (profile_picture_url !== undefined && orgPerson.profile_picture_url && orgPerson.profile_picture_url !== profile_picture_url) {
      try {
        console.log('Deleting old image from storage:', orgPerson.profile_picture_url);
        
        // Extract the file path from the old URL
        const url = new URL(orgPerson.profile_picture_url);
        const pathParts = url.pathname.split('/');
        console.log('Path parts:', pathParts);
        
        // Find the index of 'mosque-images' and get everything after it
        const mosqueImagesIndex = pathParts.findIndex(part => part === 'mosque-images');
        if (mosqueImagesIndex !== -1 && mosqueImagesIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(mosqueImagesIndex + 1).join('/');
          console.log('Extracted file path:', filePath);
          
          if (filePath) {
            const { error: storageError } = await supabaseAdmin.storage
              .from('mosque-images')
              .remove([filePath]);
            
            if (storageError) {
              console.error('Error deleting old image from storage:', storageError);
              // Don't fail the entire operation if image deletion fails
            } else {
              console.log('Successfully deleted old image from storage');
            }
          }
        } else {
          console.error('Could not find mosque-images in old URL path');
        }
      } catch (error) {
        console.error('Error parsing old image URL or deleting from storage:', error);
        // Don't fail the entire operation if image deletion fails
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PUT /api/organization-people/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // First, get the organization person to check mosque_id and get profile picture URL
    const { data: orgPerson, error: fetchError } = await supabaseAdmin
      .from('organization_people')
      .select('mosque_id, profile_picture_url')
      .eq('id', params.id)
      .single();

    if (fetchError || !orgPerson) {
      return NextResponse.json(
        { error: 'Organization person not found' },
        { status: 404 }
      );
    }

    // Check if user is admin of the mosque
    const isAdmin = await isUserMosqueAdmin(user.id, orgPerson.mosque_id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only mosque admins can delete organization people' },
        { status: 403 }
      );
    }

    // Delete the database record
    const { error } = await supabaseAdmin
      .from('organization_people')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting organization person:', error);
      return NextResponse.json(
        { error: 'Failed to delete organization person' },
        { status: 500 }
      );
    }

    // If there was a profile picture, delete it from storage
    if (orgPerson.profile_picture_url) {
      try {
        console.log('Deleting image from storage:', orgPerson.profile_picture_url);
        
        // Extract the file path from the URL
        // URL format: https://qlviyceaawhooitxlbyi.supabase.co/storage/v1/object/public/mosque-images/userId/person-timestamp.png
        const url = new URL(orgPerson.profile_picture_url);
        const pathParts = url.pathname.split('/');
        console.log('Path parts:', pathParts);
        
        // Find the index of 'mosque-images' and get everything after it
        const mosqueImagesIndex = pathParts.findIndex(part => part === 'mosque-images');
        if (mosqueImagesIndex !== -1 && mosqueImagesIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(mosqueImagesIndex + 1).join('/');
          console.log('Extracted file path:', filePath);
          
          if (filePath) {
            const { error: storageError } = await supabaseAdmin.storage
              .from('mosque-images')
              .remove([filePath]);
            
            if (storageError) {
              console.error('Error deleting image from storage:', storageError);
              // Don't fail the entire operation if image deletion fails
            } else {
              console.log('Successfully deleted image from storage');
            }
          }
        } else {
          console.error('Could not find mosque-images in URL path');
        }
      } catch (error) {
        console.error('Error parsing image URL or deleting from storage:', error);
        // Don't fail the entire operation if image deletion fails
      }
    }

    return NextResponse.json({ message: 'Organization person deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/organization-people/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
