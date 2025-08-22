# Supabase Email Templates Setup

This guide explains how to update your Supabase email templates to match your mosque application's design and branding.

## Available Templates

### 1. Signup Confirmation Email

**File:** `supabase-signup-confirmation-template.html`

**Purpose:** Sent when users sign up and need to confirm their email address.

**Supabase Variables Used:**

- `{{ .ConfirmationURL }}` - The confirmation link for email verification

### 2. Reset Password Email

**File:** `supabase-reset-password-template.html`

**Purpose:** Sent when users request to reset their password.

**Supabase Variables Used:**

- `{{ .ConfirmationURL }}` - The password reset link

## How to Update Templates in Supabase

### Step 1: Access Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Update Signup Confirmation Template

1. Click on the **"Confirm signup"** tab
2. Replace the existing HTML in the **"Message body"** section with the content from `supabase-signup-confirmation-template.html`
3. Update the **"Subject heading"** to: `Confirm Your Signup - Mosque Community`
4. Click **"Save"** to apply changes

### Step 3: Update Reset Password Template

1. Click on the **"Reset Password"** tab
2. Replace the existing HTML in the **"Message body"** section with the content from `supabase-reset-password-template.html`
3. Update the **"Subject heading"** to: `Reset Your Password - Mosque Community`
4. Click **"Save"** to apply changes

### Step 4: Customize the Templates (Optional)

You can customize the template by modifying these elements in the HTML:

- **Mosque Name**: Replace `"Mosque Community"` with your actual mosque name
- **Colors**: Update the CSS color values to match your branding
- **Content**: Modify the welcome message and feature list
- **Footer**: Update contact information and team name

### Step 5: Test the Templates

**Signup Confirmation:**

1. Create a test user account through your application
2. Check that the confirmation email uses the new template
3. Verify that the confirmation link works correctly
4. Test the email appearance on different devices and email clients

**Reset Password:**

1. Use the "Forgot Password" feature on your application
2. Check that the reset password email uses the new template
3. Verify that the reset password link works correctly
4. Test the email appearance on different devices and email clients

## Template Features

✅ **Responsive Design** - Works on desktop and mobile devices
✅ **Modern Styling** - Clean, professional appearance with mosque branding
✅ **Security Notes** - Includes important security information
✅ **Clear Call-to-Action** - Prominent confirmation button
✅ **Fallback Link** - Alternative link for users with email client issues
✅ **Islamic Greeting** - Includes "Barakallahu feeki" in the footer
✅ **Feature Preview** - Shows users what they can do after confirmation

## Troubleshooting

### Template Not Showing

- Ensure you saved the changes in Supabase dashboard
- Clear your browser cache and try again
- Check that you're editing the correct email template type

### Styling Issues

- Some email clients have limited CSS support
- The template uses inline styles and email-safe CSS
- Test with different email providers (Gmail, Outlook, etc.)

### Variables Not Working

- Ensure you're using the correct Supabase template variables
- Check that the variable syntax matches exactly: `{{ .VariableName }}`
- Refer to Supabase documentation for available variables

## Additional Templates

You can create similar templates for other Supabase email types:

- **Magic Link** - For passwordless login
- **Password Recovery** - For password reset emails
- **Email Change** - For email address changes
- **Invite User** - For user invitations

Follow the same process and use the appropriate Supabase variables for each template type.

## Support

If you encounter issues with the email templates:

1. Check the Supabase documentation for email template variables
2. Test the HTML template in an email testing tool
3. Verify that your Supabase project settings are correct
4. Contact Supabase support if you experience platform-specific issues
