# 🔍 Conflict Detection Debug Guide

## Current Issue
The conflict warnings are not showing in the MultiSpaceSelector dropdown when creating events.

## Step-by-Step Debugging

### 🧪 **Step 1: Check Browser Console**
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Create a new event and look for these specific debug messages:
   - `🎯 useEffect triggered for conflict checking:`
   - `📋 Checking date X:`
   - `✅ All conditions met for date X, calling checkConflicts` OR `❌ Missing required data for date X`

**If you DON'T see these messages**: The conflict detection code isn't running at all.

### 🏢 **Step 2: Use Venues with Spaces**
From the server logs, these venues have spaces:
- **"te"**: 1 space
- **"asd"**: 2 spaces

⚠️ **Avoid venues showing "0 spaces"** - they won't trigger conflict detection.

### ⏰ **Step 3: Follow Exact Sequence**
When creating an event, do this **in order**:

1. **Select a venue** with spaces (te or asd)
2. **Select a date** (any future date)
3. **Set start time** (e.g., 9:00 AM)
4. **Set end time** (e.g., 5:00 PM)
5. **Select spaces** from the dropdown

**⚡ The conflict API should be called immediately after step 5.**

### 🔍 **Step 4: Monitor Server Logs**
Watch for this in the server terminal:
```
[express] POST /api/bookings/check-conflicts 200 in Xms
```

**If you see this**: ✅ The API is being called!
**If you don't see this**: ❌ The frontend isn't calling the API.

### 🎯 **Step 5: Check Debug Output**
In the browser console, look for:
```
🔍 Conflict check response: {
  index: 0,
  spaceIds: ["space-id"],
  eventDate: "2025-09-20",
  startTime: "09:00 AM",
  endTime: "05:00 PM",
  response: {...}
}
```

## 🚨 **Expected Problems & Solutions**

### Problem 1: "No console messages"
**Cause**: React component not mounting or debug code stripped
**Solution**: Refresh page, try different browser

### Problem 2: "❌ Missing required data"
**Cause**: One of these is missing:
- spaceIds array is empty
- startTime is null/undefined
- endTime is null/undefined

**Solution**: Ensure all three fields are filled in the exact order above

### Problem 3: "API called but no conflicts shown"
**Cause**: No existing bookings conflict, or response format issue
**Solution**: Create a real conflicting booking first, then test

### Problem 4: "Using venue with 0 spaces"
**Cause**: Selected venue has no spaces defined
**Solution**: Switch to venue "te" or "asd" which have spaces

## 🎯 **Test Case for You**
1. Open http://localhost:3001
2. Create Event
3. Select venue: **"te"** (has 1 space)
4. Select date: **Today (2025-09-20)**
5. Start time: **9:00 AM**
6. End time: **5:00 PM**
7. **Open spaces dropdown** - this should trigger conflict detection
8. Check browser console for debug messages
9. Check server terminal for API call

## 📊 **What Should Happen**
- ✅ Console shows: `✅ All conditions met for date 0, calling checkConflicts`
- ✅ Server shows: `POST /api/bookings/check-conflicts 200`
- ✅ If conflicts exist: Red warning appears in space dropdown
- ✅ If no conflicts: No warning (but API still called)

## 🔧 **If Still Not Working**
1. **Clear browser cache** and refresh
2. **Try a different browser**
3. **Check if you have existing bookings** - no existing bookings = no conflicts to show
4. **Verify you're using venues with spaces** (te or asd)

Let me know what you see in the console and server logs!