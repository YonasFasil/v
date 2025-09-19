# cPanel Email Configuration Checklist

## ✅ Quick Setup Steps

### 1. DNS Records (in cPanel Zone Editor)

#### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com include:mail.venuine.com ip4:YOUR_SERVER_IP ~all
```

#### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@venuine.com
```

#### MX Records
```
Priority 0: mail.venuine.com
Priority 10: mail.venuine.com
```

### 2. cPanel Email Setup

1. **Create Email Account:**
   - Email: notification@venuine.com
   - Strong password
   - Quota: Unlimited

2. **Email Deliverability:**
   - Go to Email Deliverability
   - Click "Install Suggested Records" for DKIM
   - Verify all show green checkmarks

3. **Email Routing:**
   - Set to "Local Mail Exchanger"

### 3. Application Configuration

1. **Environment Variables (.env):**
```bash
# Keep these for Gmail fallback
GLOBAL_EMAIL_ADDRESS=your-gmail@gmail.com
GLOBAL_EMAIL_PASSWORD=your-app-password

# Database for configuration
DATABASE_URL=your-postgres-url
JWT_SECRET=your-jwt-secret
```

2. **In Super Admin Panel:**
   - Email: notification@venuine.com
   - Password: [cPanel email password]
   - IMAP Host: mail.venuine.com
   - IMAP Port: 993
   - Click "Test IMAP Connection"
   - Click "Save IMAP Configuration"
   - Click "Start Email Monitoring"

### 4. Testing

1. **Use "Check Email Deliverability" button** in app
2. **Send test email** from the app
3. **Check these tools:**
   - https://mxtoolbox.com/emailhealth (Full email health check)
   - https://www.mail-tester.com (Spam score test)
   - https://toolbox.googleapps.com/apps/checkmx/ (Google's MX checker)

### 5. Monitor Performance

- Check bounce rates (< 2%)
- Monitor spam complaints (< 0.1%)
- Review DMARC reports weekly
- Test deliverability monthly

## 🎯 Expected Result

When properly configured:
- SPF: PASS ✅
- DKIM: PASS ✅
- DMARC: PASS ✅
- Spam Score: < 2 (out of 10)
- Inbox placement: > 95%

## 📞 Need Help?

1. Contact your hosting provider for server IP
2. Check cPanel documentation for your specific version
3. Use the app's debugging tools to verify configuration