# VENUIN Authentication Architecture

## Clean Authentication Structure

### 1. Single Authentication System
**One login system for all user types with role-based routing:**

```
POST /api/auth/login (for ALL users)
├── Super Admin → /admin/* (platform management)
├── Tenant Owner → /t/:slug/* (tenant management)  
├── Tenant User → /t/:slug/* (limited access)
└── Unverified → /verify-email
```

### 2. User Types & Roles

**Super Admin:**
- Email: eyosiasyimer@gmail.com (protected)
- Role: `super_admin`
- Access: Platform management, tenant oversight
- Routes: `/admin/*` (clean, professional URLs)

**Tenant Owner:**
- Created during signup with tenant
- Role: `owner`
- Access: Full tenant management
- Routes: `/t/:slug/*`

**Tenant Users:**
- Invited by tenant owners
- Roles: `admin`, `manager`, `staff`, `viewer`
- Access: Role-based tenant features
- Routes: `/t/:slug/*`

### 3. Simplified User Journey

**New Customer Signup:**
```
1. Visit /pricing → Select plan
2. /signup → Create account + tenant + subscription
3. /verify-email → Email verification
4. Automatic redirect to /t/company-slug/dashboard
```

**Super Admin Access:**
```
1. /login → Enter super admin credentials
2. Automatic redirect to /admin/dashboard
```

**Team Member Invitation:**
```
1. Tenant owner invites via /t/:slug/team
2. Invitee gets email with /invite/:token link
3. Sets password and joins tenant
4. Access to /t/:slug/* based on role
```

### 4. Clean URL Structure

**Public:**
- `/` - Marketing homepage
- `/features` - Feature showcase
- `/pricing` - Pricing plans
- `/login` - Universal login
- `/signup` - Customer signup

**Platform Admin:**
- `/admin/dashboard` - Platform overview
- `/admin/tenants` - Tenant management
- `/admin/users` - User management
- `/admin/billing` - Platform billing
- `/admin/analytics` - Platform analytics

**Tenant App:**
- `/t/:slug/dashboard` - Tenant dashboard
- `/t/:slug/events` - Event management
- `/t/:slug/customers` - Customer management
- `/t/:slug/team` - Team management
- `/t/:slug/settings` - Tenant settings

### 5. Database Structure

**users table:**
```sql
- id (primary key)
- email (unique)
- password_hash
- first_name
- last_name
- email_verified
- created_at
- updated_at
```

**super_admins table:**
```sql
- user_id (foreign key to users)
- created_at
```

**tenants table:**
```sql
- id (primary key)
- name
- slug (unique)
- status (active/suspended)
- plan_id
- created_at
```

**tenant_users table:**
```sql
- id (primary key)
- tenant_id (foreign key)
- user_id (foreign key)
- role (owner/admin/manager/staff/viewer)
- status (active/inactive)
- invited_at
- joined_at
```

### 6. Session Management

**Single session structure:**
```typescript
interface UserSession {
  userId: string;
  email: string;
  isSuperAdmin: boolean;
  currentTenant?: {
    id: string;
    slug: string;
    role: string;
  };
}
```

### 7. Middleware Chain

**Authentication Flow:**
```
1. isAuthenticated() - Check valid session
2. isSuperAdmin() - Check super admin status
3. tenantContext() - Load tenant context for tenant routes
4. requireRole() - Enforce role permissions
```

## Benefits of This Structure:

✅ **Single Login System** - One `/login` for all users
✅ **Clear User Roles** - Explicit role hierarchy
✅ **Professional URLs** - No hidden admin URLs
✅ **Simplified Onboarding** - Signup creates everything at once
✅ **Scalable Team Management** - Easy to add team members
✅ **Clear Separation** - Platform admin vs tenant management
✅ **Better Security** - Role-based access throughout
✅ **Easier Maintenance** - Less complex middleware logic

## Implementation Priority:

1. Consolidate authentication routes
2. Implement single session structure
3. Create clean URL structure
4. Simplify middleware chain
5. Update frontend routing
6. Test all user flows