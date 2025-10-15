# Database Setup Guide

This guide will help you set up the Supabase database for the Mosque Management System using the provided migration files.

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Project Setup**: Create a new Supabase project
3. **Environment Variables**: Have your Supabase URL and anon key ready

## Step 1: Run the Migration

### Option A: Using Supabase Dashboard (Recommended)

1. **Open SQL Editor**:

   - Go to your Supabase project dashboard
   - Navigate to "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Copy and Execute Migration**:

   - Open the `supabase-migration.sql` file
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" to execute the migration

3. **Verify Tables**:
   - Go to "Table Editor" in the left sidebar
   - You should see all the created tables

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push
```

## Step 2: Configure Environment Variables

Update your `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 3: Update Supabase Client

Update your `src/lib/supabase.ts` file to use the new types:

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// For admin operations (server-side only)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

## Step 4: Set Up Authentication

### Configure Auth Settings

1. **Go to Authentication > Settings**
2. **Site URL**: Set to your domain (e.g., `http://localhost:3000` for development)
3. **Redirect URLs**: Add your callback URLs

### Email Templates (Optional)

Customize email templates in Authentication > Templates:

- Confirm signup
- Reset password
- Magic link

## Step 5: Configure Row Level Security (RLS)

The migration automatically sets up RLS policies, but you may want to review and customize them:

1. **Go to Authentication > Policies**
2. **Review existing policies** for each table
3. **Modify as needed** for your specific requirements

## Step 6: Set Up Storage (Optional)

If you plan to store files (images, documents):

1. **Go to Storage**
2. **Create buckets**:

   - `avatars` - for user profile pictures
   - (optional) `programs` - for khairat program images
   
   - `resources` - for resource files

3. **Set up policies** for each bucket

## Database Schema Overview

### Core Tables

- **`mosques`** - Mosque information and settings
- **`user_profiles`** - Extended user information (linked to auth.users)
- **`mosque_administrators`** - Admin roles and permissions

### Feature Modules

- **Khairat**: `khairat_programs`, `khairat_contributions`
 
- **Resources**: `resources`, `resource_categories`

### System Tables

- **`notifications`** - User notifications
- **`audit_logs`** - System activity tracking
- **`system_settings`** - Configuration settings

## Sample Data

The migration includes sample data for:

- One mosque (Islamic Center of Excellence)
- Khairat program
- Resource categories

**To customize or remove sample data**:

1. Edit the `supabase-migration.sql` file
2. Modify or remove the INSERT statements at the bottom
3. Re-run the migration

## User Roles and Permissions

### Account Types

- **Member**: Regular community members
- **Admin**: Mosque administrators

### User Roles

- **Admin**: Full system access
- **Imam**: Religious leadership
- **Board Member**: Governance and oversight
- **Volunteer Coordinator**: Event and volunteer management
- **Treasurer**: Financial oversight
- **Secretary**: Administrative tasks
- **Moderator**: Content moderation
- **Member**: Basic access

### Membership Types

- **Regular**: Standard membership
- **Family**: Family membership
- **Student**: Student discount membership
- **Senior**: Senior citizen membership

## API Integration

### Example: Fetching User Profile

```typescript
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/database';

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}
```

### Example: Creating a Khairat Program

```typescript
import { supabase } from '@/lib/supabase';

export async function createKhairatProgram(program: { mosque_id: string; name: string; target_amount?: number }) {
  const { data, error } = await supabase
    .from('khairat_programs')
    .insert({
      mosque_id: program.mosque_id,
      name: program.name,
      target_amount: program.target_amount ?? null,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create khairat program: ${error.message}`);
  }

  return data;
}
```

## Security Considerations

### Row Level Security (RLS)

- All tables have RLS enabled
- Users can only access data from their mosque
- Admins have broader access within their mosque

### Admin Verification

- Change the default admin verification code in production
- Implement secure admin invitation system
- Use environment variables for sensitive configurations

### Data Validation

- Implement client-side validation
- Add server-side validation in API routes
- Use TypeScript types for type safety

## Monitoring and Maintenance

### Database Monitoring

1. **Monitor query performance** in Supabase dashboard
2. **Review slow queries** and optimize as needed
3. **Check storage usage** regularly

### Backup Strategy

1. **Enable automatic backups** in Supabase
2. **Export data regularly** for additional safety
3. **Test restore procedures** periodically

### Audit Logs

- The `audit_logs` table tracks all system activities
- Implement log rotation to manage storage
- Use for security monitoring and compliance

## Troubleshooting

### Common Issues

1. **Migration Fails**:

   - Check for syntax errors in SQL
   - Ensure you have proper permissions
   - Try running sections separately

2. **RLS Policies Block Access**:

   - Review policy conditions
   - Check user authentication status
   - Verify mosque associations

3. **Type Errors**:
   - Ensure TypeScript types match database schema
   - Update types after schema changes
   - Check for null/undefined handling

### Getting Help

1. **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
2. **Supabase Community**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
3. **Project Issues**: Create an issue in your project repository

## Next Steps

1. **Update existing components** to use the new database schema
2. **Implement API routes** for CRUD operations
3. **Add proper error handling** and validation
4. **Set up email notifications** for important events
5. **Configure file storage** for images and documents
6. **Implement search functionality** using full-text search
7. **Add analytics and reporting** features
8. **Set up automated testing** for database operations

## Migration Checklist

- [ ] Supabase project created
- [ ] Migration SQL executed successfully
- [ ] Environment variables configured
- [ ] Supabase client updated with types
- [ ] Authentication settings configured
- [ ] RLS policies reviewed
- [ ] Storage buckets created (if needed)
- [ ] Sample data customized or removed
- [ ] API integration tested
- [ ] Security measures implemented
- [ ] Backup strategy configured

---

**Important**: Always test the migration in a development environment before applying to production. Keep backups of your data and be prepared to rollback if needed.
