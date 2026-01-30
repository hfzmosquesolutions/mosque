# Stripe Webhook Migration to Supabase Edge Functions

This document explains the migration from Next.js API routes to Supabase Edge Functions for handling Stripe webhooks.

## Why Migrate?

1. **Security**: Edge Functions are isolated and don't expose your Next.js API routes
2. **Scalability**: Edge Functions scale independently from your Next.js application
3. **Simplicity**: No need to manage webhook endpoints in your Next.js app
4. **Centralized**: All webhook logic is in one place within Supabase

## Migration Steps

### 1. Deploy the Edge Function

The Stripe webhook handler has been moved to `supabase/functions/stripe-webhook/index.ts`.

Deploy it using:
```bash
supabase functions deploy stripe-webhook
```

### 2. Set Environment Variables in Supabase

Set these secrets in your Supabase project:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_your_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2.5. Configure Function to Allow Public Access

**IMPORTANT**: Stripe webhooks don't send Supabase JWT tokens, so you need to disable JWT verification for this function.

**Option 1: Using Supabase Dashboard (Recommended)**
1. Go to your Supabase Dashboard → Edge Functions
2. Find the `stripe-webhook` function
3. Click on it to open settings
4. Find the "Verify JWT" toggle and turn it **OFF**
5. Save the changes

**Option 2: Using Supabase CLI**
Create a config file for the function:
```bash
# Create config file
cat > supabase/functions/stripe-webhook/config.toml << EOF
[verify_jwt]
enabled = false
EOF
```

Then redeploy:
```bash
supabase functions deploy stripe-webhook
```

**Security Note**: Even though JWT verification is disabled, the function is still secure because:
- Stripe webhook signature verification ensures requests are from Stripe
- Only requests with valid Stripe signatures are processed
- The webhook secret is stored securely in Supabase secrets

### 3. Update Stripe Webhook Configuration

1. Go to Stripe Dashboard → Webhooks
2. Update your webhook endpoint URL to:
   ```
   https://your-project-ref.supabase.co/functions/v1/stripe-webhook
   ```
3. Keep the same events selected:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 4. Remove Old Webhook Route (Optional)

After confirming the Edge Function works correctly, you can optionally remove:
- `src/app/api/webhooks/stripe/route.ts`

**Note**: Keep the file for now until you've verified everything works in production.

### 5. Update Environment Variables

Remove `STRIPE_WEBHOOK_SECRET` from your `.env.local` file as it's now managed in Supabase secrets.

## Testing

### Local Development

1. Start your local Supabase:
   ```bash
   supabase start
   ```

2. Serve the Edge Function locally:
   ```bash
   supabase functions serve stripe-webhook
   ```

3. Use Stripe CLI to forward webhooks:
   ```bash
   stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
   ```

### Production

1. Deploy the function:
   ```bash
   supabase functions deploy stripe-webhook
   ```

2. Test with Stripe CLI:
   ```bash
   stripe trigger checkout.session.completed
   ```

3. Verify in your Supabase dashboard that:
   - Events are being stored in `subscription_webhook_events` table
   - Subscriptions are being updated in `user_subscriptions` table
   - Invoices are being created in `user_subscription_invoices` table

## Function Details

The Edge Function:
- Verifies webhook signatures using Stripe's SDK
- Prevents duplicate event processing by checking `subscription_webhook_events` table
- Stores all events for audit purposes
- Updates subscription and invoice data in your database
- Uses Supabase service role key for admin database operations

## Troubleshooting

### Webhook Not Receiving Events

1. Check that the function is deployed:
   ```bash
   supabase functions list
   ```

2. Verify the webhook URL in Stripe Dashboard matches your function URL

3. Check Supabase logs:
   ```bash
   supabase functions logs stripe-webhook
   ```

### Signature Verification Failing ("Invalid signature" error)

1. **Verify the webhook secret matches:**
   - Go to Stripe Dashboard → Webhooks → Your endpoint
   - Click "Reveal" next to "Signing secret" to see the current secret
   - Compare it with the secret in Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - They must match exactly (including the `whsec_` prefix)

2. **If the secret doesn't match:**
   - Update Supabase secret with the correct value:
     ```bash
     supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_correct_secret
     ```
   - Or create a new webhook endpoint in Stripe and use its new secret

3. **Check the webhook endpoint URL:**
   - Ensure the URL in Stripe matches your function URL exactly
   - Format: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
   - No trailing slashes or extra paths

4. **Verify environment variables are loaded:**
   - Check Supabase function logs to see if webhook secret is being read
   - The secret should be set and not empty

5. **Test with Stripe CLI (for local testing):**
   ```bash
   stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
   ```
   This will give you a test webhook secret that you can use for local development.

### Database Updates Not Working

1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
2. Check that the service role key has proper permissions
3. Review function logs for any errors

## Rollback

If you need to rollback to the Next.js API route:

1. Keep the old route at `src/app/api/webhooks/stripe/route.ts`
2. Update Stripe webhook URL back to:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
3. Add `STRIPE_WEBHOOK_SECRET` back to `.env.local`

The old route will continue to work as before.
