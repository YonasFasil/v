# VENUIN Production Role-Based Access Control (RBAC)

## Role Hierarchy

### 1. Super Admin (Platform Owner) - Level 1
- **Full platform control**
- **Manages:** All tenants, subscription plans, billing, platform-wide settings
- **Special privileges:** Can impersonate any tenant admin for support
- **Scope:** Entire platform / all tenants
- **Routes:** `/admin/*`, `/super-admin`
- **Middleware:** `requireSuperAdmin`

### 2. Tenant Admin (Account Owner) - Level 2  
- **Created when company signs up**
- **Manages:** Company venues, spaces, events, settings, team management
- **Billing:** Access to Customer Portal, Stripe Connect account
- **Scope:** Only their tenant's data
- **Middleware:** `requireTenantAdmin`

### 3. Staff (Tenant Team Member) - Level 3
- **Invited by Tenant Admin**
- **Permissions:** Customizable per role (create events, view customers, etc.)
- **Restrictions:** Cannot change subscription or global settings
- **Scope:** Limited to tenant data + assigned permissions
- **Middleware:** `requireStaffAccess`

### 4. Viewer (Read-Only User) - Level 4
- **Invited by Tenant Admin**  
- **Access:** View-only for bookings, customers, venues
- **Restrictions:** Cannot edit or create anything
- **Scope:** Read-only access to tenant data
- **Middleware:** `requireViewerAccess`

## Permission System

### Role-Based Permissions
```typescript
// Owner/Admin - Full access by default
if (['owner', 'admin'].includes(user.currentTenant.role)) {
  // Allow all actions
}

// Staff/Manager - Check specific permissions
if (user.currentTenant.permissions[permission]) {
  // Allow specific action
}

// Viewer - Read-only access
// Only GET requests allowed
```

### Production Security Features
- ✅ Database-level role isolation
- ✅ Session-based authentication  
- ✅ JWT token validation
- ✅ Tenant context isolation
- ✅ Permission-based action control
- ✅ Super admin protection (cannot be deleted)
- ✅ Clean professional URLs (`/admin/*`)

## Authentication Flow

1. **User logs in** → JWT + Session created
2. **Get primary tenant** → Role and permissions loaded
3. **Route access** → Middleware checks role hierarchy
4. **Action permission** → Specific permission validation
5. **Data isolation** → Tenant context enforced

This production-ready RBAC system ensures complete security isolation between tenants while providing the super admin full platform oversight capabilities.