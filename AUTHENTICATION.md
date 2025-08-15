# Authentication System Documentation

This document outlines the authentication system implemented in this Next.js application using Supabase, React Context, and protected routes.

## Features Implemented

### 1. Authentication Context Provider (`AuthContext`)
- **Location**: `src/contexts/AuthContext.tsx`
- **Purpose**: Global state management for user authentication
- **Features**:
  - User session management
  - Authentication state tracking
  - Sign in/up/out functionality
  - Password reset capability
  - Real-time auth state changes

### 2. Protected Route Wrapper
- **Location**: `src/components/auth/ProtectedRoute.tsx`
- **Purpose**: Route protection based on authentication status
- **Features**:
  - Redirect unauthenticated users to login
  - Redirect authenticated users away from auth pages
  - Loading state handling
  - Higher-order component (`withAuth`) for easy page protection

### 3. Custom Authentication Hooks
- **Location**: `src/hooks/useAuthRedirect.ts`
- **Purpose**: Simplified authentication logic for components
- **Hooks Available**:
  - `useAuthRedirect()` - General redirect logic
  - `useRequireAuth()` - For protected pages
  - `useRedirectIfAuthenticated()` - For auth pages (login/signup)

## Implementation Details

### Global Setup

The `AuthProvider` is wrapped around the entire application in `layout.tsx`:

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Using the Authentication Context

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.email}!</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  );
}
```

### Protecting Routes

#### Method 1: Using ProtectedRoute Component

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

#### Method 2: Using withAuth HOC

```tsx
import { withAuth } from '@/components/auth/ProtectedRoute';

function DashboardPage() {
  return <div>Protected content</div>;
}

export default withAuth(DashboardPage);
```

#### Method 3: Using Custom Hooks

```tsx
import { useRequireAuth } from '@/hooks/useAuthRedirect';

export default function ProtectedPage() {
  const { user, loading } = useRequireAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return <div>Protected content for {user?.email}</div>;
}
```

### Preventing Authenticated Users from Accessing Auth Pages

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function LoginPage() {
  return (
    <ProtectedRoute requireAuth={false}>
      <LoginForm />
    </ProtectedRoute>
  );
}
```

## Pages and Routes

### Public Routes
- `/` - Home page (accessible to all, shows different content based on auth status)

### Authentication Routes (redirect authenticated users)
- `/login` - Sign in page
- `/signup` - Sign up page

### Protected Routes (require authentication)
- `/dashboard` - User dashboard (example protected page)

## Authentication Flow

1. **Initial Load**: `AuthProvider` checks for existing session
2. **Sign In**: User credentials are validated via Supabase
3. **Session Management**: Auth state is automatically updated
4. **Route Protection**: `ProtectedRoute` components handle redirects
5. **Sign Out**: Session is cleared and user is redirected

## Security Features

- **Automatic Session Refresh**: Supabase handles token refresh
- **Real-time Auth Changes**: Context updates immediately on auth state changes
- **Route Protection**: Unauthorized access attempts are redirected
- **Loading States**: Prevents flash of wrong content during auth checks
- **Error Handling**: Comprehensive error messages for auth failures

## Best Practices Implemented

1. **Centralized State Management**: Single source of truth for auth state
2. **Separation of Concerns**: Auth logic separated from UI components
3. **Reusable Components**: `ProtectedRoute` can be used anywhere
4. **Custom Hooks**: Simplified auth logic for common use cases
5. **TypeScript Support**: Full type safety for auth-related code
6. **Loading States**: Proper UX during authentication checks
7. **Error Boundaries**: Graceful error handling

## Usage Examples

### Creating a New Protected Page

```tsx
// src/app/profile/page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

function ProfileContent() {
  const { user } = useAuth();
  
  return (
    <div>
      <h1>User Profile</h1>
      <p>Email: {user?.email}</p>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
```

### Adding Authentication to Existing Components

```tsx
import { useAuth } from '@/contexts/AuthContext';

export function Navigation() {
  const { user, signOut } = useAuth();
  
  return (
    <nav>
      {user ? (
        <>
          <span>Welcome, {user.email}</span>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <>
          <Link href="/login">Login</Link>
          <Link href="/signup">Sign Up</Link>
        </>
      )}
    </nav>
  );
}
```

This authentication system provides a robust, scalable foundation for managing user authentication in your Next.js application.