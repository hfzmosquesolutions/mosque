# Authentication Implementation Guide

This document outlines the Supabase authentication implementation for the Mosque Management System.

## Overview

The authentication system is built using Supabase Auth with the following features:

- Email/password authentication
- User profiles with role-based access
- Password reset functionality
- Secure session management
- Automatic profile creation on signup

## Architecture

### Core Components

1. **AuthContext** (`src/contexts/AuthContext.tsx`)

   - Global authentication state management
   - Handles auth state changes
   - Provides authentication methods

2. **AuthService** (`src/services/auth.ts`)

   - Authentication business logic
   - User profile management
   - Error handling

3. **Database Types** (`src/types/database.ts`)

   - TypeScript definitions for database schema
   - Type safety for all database operations

4. **API Services** (`src/services/api.ts`)
   - Data access layer
   - CRUD operations for profiles, mosques, members

### Database Schema

#### Profiles Table

```sql
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    phone TEXT,
    role user_role DEFAULT 'member',
    mosque_id UUID,
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

#### Roles and Permissions

- `super_admin`: Full system access
- `mosque_admin`: Mosque-level administration
- `ajk`: Committee member with limited admin access
- `member`: Basic member access

## Authentication Flow

### Sign Up Process

1. User submits signup form
2. Supabase creates auth user
3. Database trigger creates profile record
4. User receives email verification
5. Profile is linked to auth user

### Sign In Process

1. User submits login credentials
2. Supabase validates credentials
3. AuthContext loads user profile
4. User is redirected to dashboard

### Password Reset

1. User requests password reset
2. Supabase sends reset email
3. User clicks reset link
4. User sets new password
5. Automatic redirect to login

## Security Features

### Row Level Security (RLS)

- Users can only access their own data
- Mosque admins can manage their mosque
- Proper data isolation between mosques

### Middleware Protection

- Protected routes require authentication
- Automatic redirects for unauthenticated users
- Session validation on route changes

## Usage Examples

### Using the AuthContext

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, profile, isLoading, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <p>Welcome, {profile?.full_name}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### API Service Usage

```tsx
import { ProfileService } from '@/services/api';

// Get user profile
const profile = await ProfileService.getProfile(userId);

// Update profile
const updatedProfile = await ProfileService.updateProfile(userId, {
  full_name: 'New Name',
  phone: '+1234567890',
});
```

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Error Handling

The system includes comprehensive error handling:

- Network errors
- Authentication errors
- Database errors
- Form validation errors

Errors are displayed to users with appropriate messages and logged for debugging.

## Future Enhancements

Planned authentication features:

- Social login (Google, Facebook)
- Multi-factor authentication (MFA)
- Single sign-on (SSO)
- OAuth integration
- API key authentication for external services

## Testing

### Manual Testing Checklist

- [ ] User can sign up with valid email/password
- [ ] User receives verification email
- [ ] User can sign in with verified account
- [ ] User can reset password
- [ ] User profile is created automatically
- [ ] Protected routes redirect unauthenticated users
- [ ] User can sign out successfully
- [ ] Session persists across browser refresh

### Automated Testing

Future implementation will include:

- Unit tests for AuthService
- Integration tests for AuthContext
- E2E tests for authentication flow

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**

   - Check environment variables
   - Verify Supabase project settings
   - Restart development server

2. **User not redirected after login**

   - Check middleware configuration
   - Verify redirect URLs in Supabase settings
   - Check browser console for errors

3. **Profile not created on signup**
   - Verify database trigger exists
   - Check database permissions
   - Review Supabase logs

### Debug Tips

- Check browser network tab for failed requests
- Review Supabase logs in dashboard
- Use browser developer tools to inspect auth state
- Check middleware execution in server logs

## Best Practices

1. **Never expose service role key in client code**
2. **Always validate user input before authentication**
3. **Use TypeScript for type safety**
4. **Implement proper error boundaries**
5. **Keep auth state management centralized**
6. **Use environment variables for configuration**
7. **Implement proper loading states**
8. **Handle edge cases gracefully**

## Migration Guide

If migrating from another auth system:

1. Export user data from old system
2. Create migration script for user profiles
3. Update password reset workflows
4. Test all authentication flows
5. Update any hardcoded auth logic
