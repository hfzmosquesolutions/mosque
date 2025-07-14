# Supabase Setup Guide

This guide will help you set up Supabase for your Mosque Management System.

## Prerequisites

1. Node.js and npm installed
2. A Supabase account (sign up at https://supabase.com)

## Step 1: Create a New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - Name: `mosque-management-system`
   - Database Password: Choose a strong password (save this!)
   - Region: Choose the closest region to your users
5. Click "Create new project"

## Step 2: Get Your Project Credentials

1. Go to your project dashboard
2. Click on "Settings" in the left sidebar
3. Click on "API" under Settings
4. Copy the following values:
   - Project URL
   - Project API Key (anon/public)
   - Project API Key (service_role/secret) - keep this secure!

## Step 3: Configure Environment Variables

1. Rename `.env.example` to `.env.local`
2. Update the file with your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here
```

To generate a secure `NEXTAUTH_SECRET`, run:

```bash
openssl rand -base64 32
```

## Step 4: Set Up Database Schema

1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

### Important: Fix RLS Policies

If you encounter "row violates row-level security policy" errors during user registration:

1. Run the SQL script from `supabase/fix_rls_policies.sql` in your SQL Editor
2. This adds the missing INSERT policies required for user registration
3. The error occurs because the initial schema was missing INSERT policies for the profiles table

## Step 5: Configure Authentication

1. Go to "Authentication" in your Supabase dashboard
2. Click on "Settings" under Authentication
3. Configure the following settings:

### Site URL

- Add your production domain (e.g., `https://yourdomain.com`)
- For development, `http://localhost:3000` is already included

### Redirect URLs

Add the following URLs:

- `http://localhost:3000/auth/callback` (for development)
- `https://yourdomain.com/auth/callback` (for production)

### Email Templates (Optional)

You can customize the email templates for:

- Confirm signup
- Reset password
- Magic link

## Step 6: Install Dependencies

The required dependencies are already installed if you ran `npm install`. If not, run:

```bash
npm install @supabase/supabase-js
```

## Step 7: Test the Setup

1. Start your development server:

```bash
npm run dev
```

2. Go to `http://localhost:3000`
3. Try creating a new account
4. Check your Supabase dashboard to see if the user was created

## Features Ready to Use

After completing the setup, you'll have:

✅ **User Authentication**

- Sign up with email/password
- Sign in with email/password
- Password reset functionality
- Email verification

✅ **Database Schema**

- User profiles
- Mosque management
- Member management
- Role-based access control

✅ **Security**

- Row Level Security (RLS) policies
- Secure API endpoints
- JWT-based authentication

## Next Steps

1. **Configure Email Provider** (Optional but recommended)

   - Go to Authentication > Settings > SMTP Settings
   - Configure your email provider (Gmail, SendGrid, etc.)

2. **Set Up Custom Domain** (For production)

   - Configure your custom domain in Supabase settings

3. **Add More Features**
   - Finance management
   - Event/program management
   - Donation tracking
   - Reporting

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**

   - Check that your environment variables are correctly set
   - Make sure `.env.local` is in your project root
   - Restart your development server after changing environment variables

2. **Database connection errors**

   - Verify your Supabase project URL is correct
   - Check that your database password is correct
   - Ensure your IP is not blocked (Supabase allows all IPs by default)

3. **Authentication not working**
   - Verify your redirect URLs are configured correctly
   - Check browser console for any error messages
   - Ensure your site URL is set correctly in Supabase settings

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Join the [Supabase Discord](https://discord.supabase.com/)
- Check the project's GitHub issues

## Security Considerations

1. **Never commit sensitive keys to version control**
2. **Use environment variables for all configuration**
3. **Regularly rotate your service role key**
4. **Enable 2FA on your Supabase account**
5. **Review and test your RLS policies**

## Production Deployment

When deploying to production:

1. Update environment variables with production values
2. Configure your production domain in Supabase
3. Set up proper backup strategies
4. Configure monitoring and alerting
5. Test all authentication flows thoroughly
