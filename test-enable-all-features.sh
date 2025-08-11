#!/bin/bash
echo "Testing 'Enable All' feature functionality..."

# Get current enterprise package
echo "📦 Current Enterprise Package Features:"
curl -s -H "Cookie: $(cat fresh-login-cookies.txt 2>/dev/null)" \
  http://localhost:5000/api/admin/packages | \
  grep -A 100 '"id":"enterprise"' | \
  grep -A 50 '"features"' | head -30

echo ""
echo "🔧 Testing feature update with all features enabled..."

# Create a test update with all features enabled
FEATURES='{"dashboard-analytics":true,"event-management":true,"customer-management":true,"lead-management":true,"proposal-system":true,"stripe-payments":true,"venue-management":true,"service-packages":true,"gmail-integration":true,"task-management":true,"ai-voice-booking":true,"ai-scheduling":true,"ai-email-replies":true,"ai-lead-scoring":true,"ai-insights":true,"ai-proposal-generation":true,"mobile-responsive":true,"audit-logs":true,"custom-branding":true,"priority-support":true,"api-access":true,"advanced-reporting":true,"calendar-integration":true,"floor-plan-designer":true}'

curl -s -X PUT \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat fresh-login-cookies.txt 2>/dev/null)" \
  -d "{
    \"name\": \"Enterprise\",
    \"description\": \"Complete solution for large venue management companies\",
    \"features\": $FEATURES,
    \"limits\": {
      \"maxUsers\": 50,
      \"maxVenues\": 10,
      \"maxSpacesPerVenue\": 100
    },
    \"priceMonthly\": 199,
    \"priceYearly\": 1999,
    \"status\": \"active\"
  }" \
  http://localhost:5000/api/admin/packages/enterprise

echo ""
echo "✅ Update complete. Checking result..."

# Verify the update worked
echo "📋 Updated Enterprise Package:"
curl -s -H "Cookie: $(cat fresh-login-cookies.txt 2>/dev/null)" \
  http://localhost:5000/api/admin/packages | \
  grep -A 100 '"id":"enterprise"' | head -40

echo ""
echo "🎯 Test complete!"