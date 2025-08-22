# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your mosque management application using Supabase's online configuration.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Access to your Supabase dashboard
- Your Supabase project URL

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on it and press "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Give it a name (e.g., "Mosque App OAuth")

## Step 4: Configure Authorized Redirect URIs

Add the following URIs to your OAuth client:

### For Local Development:
```
http://127.0.0.1:54321/auth/v1/callback
```

### For Production:
```
https://qlviyceaawhooitxlbyi.supabase.co/auth/v1/callback
```

## Step 5: Get Your Credentials

After creating the OAuth client, you'll get:
- **Client ID**: A long string ending with `.apps.googleusercontent.com`
- **Client Secret**: A shorter secret string

## Step 6: Configure Google OAuth in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to "Authentication" > "Providers"
4. Find "Google" in the list of providers
5. Toggle "Enable sign in with Google" to ON
6. Enter your **Client ID** from Step 5
7. Enter your **Client Secret** from Step 5
8. Click "Save"

## Step 7: Verify Configuration

Google OAuth is now configured in your Supabase online dashboard. No local configuration files need to be modified.

## Step 8: Test the Implementation

After configuring Google OAuth in Supabase dashboard:

1. Go to your login page (`http://localhost:3000/login`)
2. Click the "Continue with Google" button
3. You should be redirected to Google's OAuth consent screen
4. After authorization, you'll be redirected back to your dashboard

No server restart is required since the configuration is handled by Supabase online.

## Testing

1. Go to your login page (`http://localhost:3000/login`)
2. Click the "Continue with Google" button
3. You should be redirected to Google's OAuth consent screen
4. After authorization, you'll be redirected back to your dashboard

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**: Make sure the redirect URI in Google Cloud Console exactly matches the one Supabase expects
2. **"invalid_client" error**: Check that your Client ID and Secret are correctly configured in the Supabase dashboard
3. **"access_denied" error**: The user cancelled the OAuth flow or your app isn't approved
4. **Google provider not enabled**: Ensure you've toggled "Enable sign in with Google" to ON in Supabase dashboard

### Debug Steps:

1. Check Supabase logs in the dashboard under "Authentication" > "Logs"
2. Verify Google OAuth is enabled in Supabase dashboard under "Authentication" > "Providers"
3. Ensure Google Cloud Console project has the correct APIs enabled
4. Check that redirect URIs are exactly as specified above
5. Confirm Client ID and Secret are correctly entered in Supabase dashboard
6. Test the OAuth flow in an incognito/private browser window

## Security Notes

- Your Google OAuth credentials are securely stored in Supabase's online infrastructure
- No local credential storage is required - everything is handled by Supabase
- Consider setting up separate OAuth clients for development and production
- Regularly rotate your client secrets for security
- Monitor authentication logs in your Supabase dashboard

## Additional Resources

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)