# VENUIN Feature Enforcement System Guide

## Overview

VENUIN now has a comprehensive feature enforcement system that connects super admin feature packages to real functionality within tenant applications. Every feature listed in a package is actually enforced and functional.

## How Feature Enforcement Works

### 1. Super Admin Feature Package Creation
- Super admins create feature packages with specific features enabled/disabled
- Each package has features (boolean flags) and limits (numeric constraints)
- Features are stored in PostgreSQL as JSONB data

### 2. Server-Side Enforcement
**API Middleware Protection:**
```typescript
// Examples of protected endpoints
POST /api/venues - requires "venue-management" feature + maxVenues limit check
POST /api/customers - requires "customer-management" feature + maxCustomers limit
POST /api/leads - requires "lead-management" feature  
POST /api/bookings - requires "event-management" feature + maxBookings limit
POST /api/proposals - requires "proposal-system" feature
POST /api/tasks - requires "task-management" feature
```

**Feature Middleware:**
- `requireFeature({ feature: "feature-name" })` - Blocks API access if feature not enabled
- `checkUsageLimit("limitName")` - Prevents exceeding usage limits
- Returns 403 Forbidden with upgrade prompts when features/limits are exceeded

### 3. Frontend Enforcement
**Dynamic Navigation:**
- Sidebar items automatically show/hide based on tenant's actual features
- No hardcoded navigation - all pulled from tenant's plan

**FeatureGate Component:**
```tsx
<FeatureGate feature="venue-management">
  <VenueManagementPanel />
</FeatureGate>
```

**FeatureButton Component:**
```tsx
<FeatureButton 
  feature="proposal-system"
  onClick={handleCreateProposal}
>
  Create Proposal
</FeatureButton>
```

### 4. Real-Time Feature Updates
- When super admin updates a package, tenant features update immediately
- No caching issues - features pulled fresh from database
- Tenant info endpoint provides real features from their assigned plan

## Available Features

### Core Features
- `dashboard-analytics` - Dashboard access and metrics
- `event-management` - Booking and event creation
- `customer-management` - Customer database and CRM
- `lead-management` - Lead tracking and conversion
- `proposal-system` - Professional proposal generation
- `task-management` - Task tracking and automation
- `venue-management` - Multi-venue support
- `service-packages` - Service catalog management

### Payment & Integration Features  
- `stripe-payments` - Payment processing with Stripe
- `gmail-integration` - Email automation and templates

### Advanced Features
- `ai-voice-booking` - Voice-to-text booking capture
- `ai-scheduling` - Smart scheduling optimization
- `ai-email-replies` - Automated email responses
- `ai-lead-scoring` - Lead priority scoring
- `ai-insights` - Predictive analytics
- `ai-proposal-generation` - AI-powered proposal content

### Enterprise Features
- `custom-branding` - Custom logos and themes
- `api-access` - REST API for integrations
- `priority-support` - Priority customer support
- `advanced-reporting` - Advanced analytics and reporting
- `audit-logs` - Security and compliance logging

## Usage Limits

### Enforced Limits
- `maxBookings` - Maximum number of bookings per tenant
- `maxVenues` - Maximum number of venues per tenant  
- `maxCustomers` - Maximum customer database size
- `maxStaff` - Maximum team members per tenant

### Limit Enforcement
- API endpoints automatically check current usage vs limits
- Frontend shows usage meters and warnings
- Prevents exceeding limits with upgrade prompts

## Testing Feature Enforcement

1. **Create Different Feature Packages in Super Admin**
   - Starter: Basic features only
   - Professional: More features + higher limits  
   - Enterprise: All features + unlimited usage

2. **Assign Different Plans to Tenants**
   - Use tenant management in super admin
   - Change tenant's plan assignment
   - Features update immediately

3. **Test Feature Restrictions**
   - Try creating venues without "venue-management"
   - Attempt proposals without "proposal-system"  
   - Exceed usage limits to see blocking behavior

4. **Verify Frontend Adaptation**
   - Navigation items appear/disappear based on plan
   - Buttons show lock icons when features unavailable
   - Upgrade prompts appear for restricted features

## Admin Management

### Super Admin Controls
- Create/edit/delete feature packages
- Set pricing and billing cycles
- Enable/disable individual features
- Configure usage limits per package
- Assign packages to tenants
- Monitor feature usage across platform

### Tenant Experience  
- See only features included in their plan
- Get upgrade prompts for restricted features
- View usage limits and current consumption
- Seamless feature access within their plan boundaries

This system ensures every feature listed in super admin packages is actually functional and enforced throughout the tenant applications.