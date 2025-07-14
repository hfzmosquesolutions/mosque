# User Deletion Guide

This guide explains how to properly delete users from your Mosque Management System using Supabase.

## Overview

User deletion in Supabase with Row Level Security (RLS) requires proper policies and procedures. This system provides comprehensive user deletion capabilities with proper security controls.

## Why You Couldn't Delete Users Before

The issue was missing **DELETE policies** in the Row Level Security (RLS) configuration. Without these policies, Supabase prevents any DELETE operations on the tables, even from authorized users.

## Fixed Issues

### 1. Missing DELETE Policies

- ✅ Added DELETE policy for `profiles` table
- ✅ Added DELETE policy for `mosques` table
- ✅ Added DELETE policy for `members` table

### 2. Cascading Deletions

- ✅ Created trigger to handle cascading deletions when a user is deleted
- ✅ Automatic cleanup of related records (profiles, members)

### 3. Permission-Based Deletion

- ✅ Users can delete their own accounts
- ✅ Mosque admins can delete users in their mosque
- ✅ Super admins can delete any user

## Implementation

### Database Functions

1. **`handle_user_deletion()`** - Trigger function that runs when a user is deleted
2. **`delete_user_account(user_id)`** - Callable function to delete a user with permission checks

### Service Layer

```typescript
// Delete current user's own account
await AuthService.deleteOwnAccount();

// Delete another user (requires admin permissions)
await AuthService.deleteUserAccount(userId);
```

### Context Layer

```typescript
// Delete current user's account
await deleteAccount();

// Delete another user (admin only)
await deleteUser(userId);
```

## Security Policies

### Profile Table

- Users can delete their own profile
- Admins can delete profiles of users in their mosque

### Mosque Table

- Only mosque admins and super admins can delete mosques
- Users can only delete mosques they created

### Members Table

- Only mosque admins and super admins can delete member records
- Must be in the same mosque as the member being deleted

## Usage Examples

### 1. User Deletes Own Account

```typescript
import { useAuth } from '@/contexts/AuthContext';

function DeleteAccountButton() {
  const { deleteAccount } = useAuth();

  const handleDelete = async () => {
    try {
      await deleteAccount();
      // User is automatically redirected to home page
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  return <button onClick={handleDelete}>Delete My Account</button>;
}
```

### 2. Admin Deletes User

```typescript
import { useAuth } from '@/contexts/AuthContext';

function AdminDeleteUserButton({ userId }: { userId: string }) {
  const { deleteUser } = useAuth();

  const handleDelete = async () => {
    try {
      await deleteUser(userId);
      // User is deleted and removed from lists
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  return <button onClick={handleDelete}>Delete User</button>;
}
```

### 3. Direct Database Function Call

```typescript
import { supabase } from '@/lib/supabase';

async function deleteUser(userId: string) {
  const { error } = await supabase.rpc('delete_user_account', {
    user_id: userId,
  });

  if (error) {
    throw error;
  }
}
```

## Setup Instructions

### 1. Run the Database Scripts (Choose One Option)

**Option A: Simple Fix (Recommended)**
Execute `supabase/simple_delete_policies.sql` in your Supabase SQL Editor:

- Adds only the missing DELETE policies
- Safe to run even if some policies already exist
- Ignore "policy already exists" errors

**Option B: Complete Setup**

1. First run `supabase/simple_delete_policies.sql` for DELETE policies
2. Then run `supabase/add_delete_function.sql` for the deletion function
3. This gives you both manual deletion and automatic cleanup

**Option C: Full Reset (If Having Issues)**

1. Run `supabase/recreate_functions.sql` to clean up and recreate everything
2. This drops and recreates all functions and triggers

### 2. Handle Existing Function Conflicts

If you get "cannot drop function because other objects depend on it":

1. **Don't try to drop the function manually**
2. Use `supabase/recreate_functions.sql` which handles dependencies properly
3. Or just run `supabase/simple_delete_policies.sql` for basic deletion support

### 2. Test the Implementation

1. Create a test user account
2. Try deleting the account from the UI
3. Verify the user is removed from all tables
4. Test admin deletion of other users

### 3. Add UI Components

Create delete buttons in your admin panels and user settings pages using the provided examples.

## Error Handling

Common errors and solutions:

### "You do not have permission to delete this user"

- User is trying to delete another user without admin privileges
- Check the user's role in the `profiles` table

### "Function delete_user_account does not exist"

- The database function hasn't been created
- Run the `user_deletion_policies.sql` script

### "No policy found for DELETE operation"

- Missing DELETE policies in RLS
- Run the `fix_rls_policies.sql` script

## Best Practices

1. **Always confirm deletion** - Add confirmation dialogs before deletion
2. **Audit trail** - Consider adding soft deletes for audit purposes
3. **Backup data** - Ensure you have backups before implementing deletion
4. **Test thoroughly** - Test all deletion scenarios in development
5. **Permission checks** - Always verify user permissions before deletion

## Migration from Previous Setup

If you had the old system without deletion capabilities:

1. Run `supabase/fix_rls_policies.sql` to add missing policies
2. Run `supabase/user_deletion_policies.sql` to add deletion functions
3. Update your application code to use the new deletion methods
4. Test all deletion scenarios

## Security Considerations

- Users can only delete their own accounts
- Admins can only delete users in their mosque
- Super admins can delete any user
- All deletions are logged in Supabase auth logs
- Related data is automatically cleaned up
- No orphaned records are left behind

The user deletion system is now fully functional and secure!
