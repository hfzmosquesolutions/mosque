# Billplz Setup Guide for Mosque Administrators

This guide provides step-by-step instructions for mosque administrators to set up Billplz payment gateway for their mosque.

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Administrator access to your mosque account
- ✅ A valid email address
- ✅ Access to your mosque's Billplz account (or ability to create one)
- ✅ Mosque profile fully set up in the system

## 🚀 Step-by-Step Setup Procedure

### Part 1: Billplz Account Setup

#### Step 1: Create Billplz Account
1. Go to [https://www.billplz.com](https://www.billplz.com)
2. Click **"Sign Up"** or **"Register"**
3. Fill in your details:
   - Email address
   - Password
   - Organization name (your mosque name)
   - Contact information
4. Verify your email address
5. Complete account verification (may require business documents)

#### Step 2: Get Your API Key
1. Log in to your Billplz dashboard
2. Navigate to **Settings** → **API Keys**
3. You'll see your **API Key** (starts with something like `abc123...`)
4. **Copy this key** - you'll need it later
   - ⚠️ **Important:** Keep this key secret and never share it publicly

#### Step 3: Get Your X-Signature Key
1. Still in the Billplz dashboard
2. Navigate to **Settings** → **X-Signature Key**
3. You'll see your **X-Signature Key** (used for webhook verification)
4. **Copy this key** - you'll need it later
   - ⚠️ **Important:** This is also sensitive - keep it secure

#### Step 4: Create a Collection
1. In the Billplz dashboard, go to **Collections**
2. Click **"Create New Collection"**
3. Fill in the collection details:
   - **Collection Name:** e.g., "Mosque Contributions" or "Khairat Payments"
   - **Description:** Brief description of what this collection is for
   - **Payment Methods:** Select which payment methods to accept
     - Credit/Debit Cards
     - Online Banking
     - e-Wallets (if available)
4. Click **"Create Collection"**
5. After creation, you'll see the **Collection ID** (looks like `abc123xyz`)
6. **Copy the Collection ID** - you'll need it in the next part

---

### Part 2: Application Setup

#### Step 5: Access Payment Settings
1. Log in to your mosque management system
2. Navigate to **Settings** → **Payment Settings** (or **Tetapan Pembayaran**)
3. Ensure you have **Administrator** role (you should see "Pentadbir" in the sidebar)

#### Step 6: Select Billplz Provider
1. In the Payment Settings page, you'll see payment provider options
2. Select **"Billplz"** as your payment provider
   - Note: You can only have one active payment provider at a time

#### Step 7: Configure Sandbox Mode (Testing)
1. **Enable Sandbox Mode** (toggle switch should be ON)
   - This allows you to test payments without real money
   - Use Billplz sandbox credentials for testing
2. Enter your **Billplz Sandbox API Key**
   - Get this from Billplz Sandbox dashboard: [https://www.billplz-sandbox.com](https://www.billplz-sandbox.com)
   - Follow the same steps as above but in the sandbox environment
3. Enter your **Billplz Sandbox X-Signature Key**
4. Enter your **Billplz Sandbox Collection ID**

#### Step 8: Test Connection
1. Click **"Test Connection"** button
2. Wait for the test to complete
3. You should see:
   - ✅ **"Connection test successful"** - if everything is correct
   - ❌ **Error message** - if there's an issue (check your credentials)

#### Step 9: Save Settings (Sandbox)
1. Once connection test passes, click **"Save Settings"**
2. Wait for confirmation: **"Payment provider settings saved successfully!"**
3. **Do NOT enable "Enable Online Payments" yet** - keep it disabled for now

#### Step 10: Test a Payment (Sandbox)
1. Create a test contribution/payment in your system
2. Try to make a payment using Billplz
3. Use Billplz test cards:
   - Card Number: `4000 0000 0000 0002`
   - Expiry: Any future date
   - CVV: Any 3 digits
4. Verify the payment appears correctly in your system
5. Check that webhook callbacks are working

#### Step 11: Switch to Production Mode
Once testing is complete:

1. **Get Production Credentials:**
   - Log in to your **Production Billplz dashboard** (not sandbox)
   - Get your **Production API Key**
   - Get your **Production X-Signature Key**
   - Get your **Production Collection ID**

2. **Update Settings:**
   - Go back to Payment Settings
   - **Disable Sandbox Mode** (toggle switch OFF)
   - Enter your **Production API Key**
   - Enter your **Production X-Signature Key**
   - Enter your **Production Collection ID**

3. **Test Production Connection:**
   - Click **"Test Connection"**
   - Verify it passes

4. **Enable Online Payments:**
   - Toggle **"Enable Online Payments"** to ON
   - Click **"Save Settings"**

#### Step 12: Final Verification
1. Make a small real payment (if possible) to verify everything works
2. Check that:
   - Payment appears in Billplz dashboard
   - Payment status updates correctly in your system
   - Webhook callbacks are received
   - Members can see payment confirmation

---

## 🔒 Security Best Practices

### Credential Management
- ✅ **Never share** your API keys or X-Signature keys
- ✅ **Use different keys** for sandbox and production
- ✅ **Rotate keys** if you suspect they're compromised
- ✅ **Don't commit** keys to version control
- ✅ **Use strong passwords** for your Billplz account

### Access Control
- ✅ Only **administrators** should have access to payment settings
- ✅ **Log out** after configuring settings
- ✅ **Review access logs** regularly in Billplz dashboard

### Testing
- ✅ **Always test in sandbox** before going live
- ✅ **Test with small amounts** first in production
- ✅ **Monitor webhook logs** for any issues

---

## 🐛 Troubleshooting

### Connection Test Fails

**Problem:** "Connection test failed" error

**Solutions:**
1. ✅ Verify API Key is correct (no extra spaces)
2. ✅ Verify X-Signature Key is correct
3. ✅ Verify Collection ID is correct
4. ✅ Check if you're using sandbox credentials in sandbox mode
5. ✅ Check if you're using production credentials in production mode
6. ✅ Verify your Billplz account is active
7. ✅ Check your internet connection

### Payments Not Processing

**Problem:** Payments created but not completing

**Solutions:**
1. ✅ Check webhook URL is accessible (should be automatic)
2. ✅ Verify Collection is active in Billplz
3. ✅ Check payment method is enabled in Collection settings
4. ✅ Review Billplz dashboard for error messages
5. ✅ Check system logs for webhook errors

### Webhook Not Receiving Callbacks

**Problem:** Payments complete in Billplz but status not updating

**Solutions:**
1. ✅ Verify X-Signature Key is correct (used for webhook verification)
2. ✅ Check webhook URL in Billplz dashboard
3. ✅ Verify your server is accessible from internet
4. ✅ Check firewall/security settings
5. ✅ Review webhook logs in Billplz dashboard

### Sandbox vs Production Confusion

**Problem:** Using wrong credentials

**Solutions:**
1. ✅ **Sandbox:** Use [billplz-sandbox.com](https://www.billplz-sandbox.com) credentials
2. ✅ **Production:** Use [billplz.com](https://www.billplz.com) credentials
3. ✅ **Always match:** Sandbox mode = Sandbox credentials, Production mode = Production credentials

---

## 📞 Support Resources

### Billplz Support
- **Email:** support@billplz.com
- **Documentation:** [https://www.billplz.com/api#introduction](https://www.billplz.com/api#introduction)
- **Dashboard:** [https://www.billplz.com](https://www.billplz.com)
- **Sandbox Dashboard:** [https://www.billplz-sandbox.com](https://www.billplz-sandbox.com)

### System Support
- Contact your system administrator
- Check system documentation
- Review error logs in the application

---

## ✅ Setup Checklist

Use this checklist to ensure you've completed all steps:

### Billplz Account
- [ ] Created Billplz account
- [ ] Verified email address
- [ ] Completed account verification
- [ ] Obtained API Key
- [ ] Obtained X-Signature Key
- [ ] Created Collection
- [ ] Obtained Collection ID

### Sandbox Setup
- [ ] Created Billplz Sandbox account
- [ ] Obtained Sandbox API Key
- [ ] Obtained Sandbox X-Signature Key
- [ ] Created Sandbox Collection
- [ ] Obtained Sandbox Collection ID
- [ ] Entered sandbox credentials in system
- [ ] Tested connection (sandbox)
- [ ] Tested payment flow (sandbox)
- [ ] Verified webhook callbacks (sandbox)

### Production Setup
- [ ] Obtained Production API Key
- [ ] Obtained Production X-Signature Key
- [ ] Obtained Production Collection ID
- [ ] Entered production credentials in system
- [ ] Disabled Sandbox Mode
- [ ] Tested connection (production)
- [ ] Enabled Online Payments
- [ ] Tested real payment (small amount)
- [ ] Verified everything works correctly

### Security
- [ ] Secured credentials (not shared)
- [ ] Using different keys for sandbox/production
- [ ] Only administrators have access
- [ ] Reviewed security best practices

---

## 🎯 Quick Reference

### Where to Find Credentials

| Credential | Location in Billplz Dashboard |
|------------|-------------------------------|
| API Key | Settings → API Keys |
| X-Signature Key | Settings → X-Signature Key |
| Collection ID | Collections → [Your Collection] → Collection ID |

### Important URLs

| Purpose | URL |
|---------|-----|
| Billplz Production | https://www.billplz.com |
| Billplz Sandbox | https://www.billplz-sandbox.com |
| API Documentation | https://www.billplz.com/api#introduction |

### Test Cards (Sandbox Only)

| Card Number | Purpose |
|-------------|---------|
| 4000 0000 0000 0002 | Successful payment |
| 4000 0000 0000 9995 | Declined payment |

---

## 📝 Notes

- Each mosque needs its **own Billplz account** and credentials
- You can have **only one active payment provider** at a time
- **Sandbox mode** is for testing - no real money is processed
- **Production mode** processes real payments - be careful!
- Always **test thoroughly** in sandbox before going live
- **Keep credentials secure** - treat them like passwords

---

## 🔄 Updating Credentials

If you need to update your Billplz credentials:

1. Go to Payment Settings
2. Update the credential fields
3. Click **"Test Connection"** to verify
4. Click **"Save Settings"**
5. Test a payment to ensure everything works

**Note:** If you rotate your API keys in Billplz, update them immediately in the system to avoid payment failures.

---

*Last Updated: [Current Date]*
*Version: 1.0*

