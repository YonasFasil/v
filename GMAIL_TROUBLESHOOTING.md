# Gmail Authentication Troubleshooting Guide

## The Issue: "Invalid credentials" Error

This error happens when Gmail App Password authentication fails. Here's how to fix it:

## Step-by-Step Solution

### 1. Generate a Fresh Gmail App Password

**IMPORTANT**: You must use a Gmail App Password, NOT your regular Gmail password.

1. Go to your Google Account: https://myaccount.google.com/
2. Click "Security" in the left sidebar
3. Make sure 2-Factor Authentication is ON (required for App Passwords)
4. Scroll down and click "App passwords"
5. Click "Select app" → Choose "Mail" or "Other (Custom name)"
6. Click "Generate"
7. **Copy the 16-character password immediately** (format: `abcd efgh ijkl mnop`)

### 2. Common Mistakes to Avoid

❌ **Don't use your regular Gmail password**
❌ **Don't include spaces when copying the App Password**  
❌ **Don't reuse old App Passwords that might have expired**
❌ **Don't use your account recovery password**

✅ **Use only the 16-character App Password**
✅ **Copy it exactly as Google provides it**
✅ **Generate fresh App Passwords when they stop working**

### 3. Test Your Credentials

1. Go to Settings → Integrations
2. Enter your **full Gmail address** (example@gmail.com)
3. Paste the **16-character App Password** in the App Password field
4. Click "Test Connection"
5. If it works, click "Start Monitoring"

### 4. If It Still Doesn't Work

**Generate a NEW App Password**:
- Delete the old one from your Google Account
- Create a brand new App Password
- Use the new password in the system

**Check Your Gmail Settings**:
- Make sure IMAP is enabled in Gmail settings
- Go to Settings → Forwarding and POP/IMAP → Enable IMAP

**Security Check**:
- Sometimes Google blocks unusual activity
- Check your Gmail "Recent security activity" for any blocked attempts
- Approve the access if asked

## Why This Happens

Gmail App Passwords can:
- Expire over time
- Get revoked by Google security systems  
- Stop working if your account security changes
- Fail if 2FA gets disabled and re-enabled

The solution is always to **generate a fresh App Password** when authentication fails.

## Success Indicators

When it's working correctly, you'll see:
- "Gmail Connected!" message after testing
- "Email monitoring started successfully" when you start monitoring
- Customer replies automatically appear in proposal communication history

## Still Having Issues?

1. Try using a different browser to generate the App Password
2. Make sure your Gmail account doesn't have unusual security restrictions
3. Contact Google Support if you can't generate App Passwords
4. Check if your organization (if using G Suite) allows App Passwords