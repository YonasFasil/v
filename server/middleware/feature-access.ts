export async function getTenantFeatures(tenantId: string): Promise<string[]> {
  const tenant = await storage.getTenant(tenantId);
  if (!tenant) {
    console.log('[TENANT-FEATURES-DEBUG] No tenant found for ID:', tenantId);
    return DEFAULT_FEATURES;
  }

  const subscriptionPackageId = tenant.subscriptionPackageId || tenant.subscription_package_id;
  console.log('[TENANT-FEATURES-DEBUG] Tenant object:', JSON.stringify(tenant, null, 2));
  console.log('[TENANT-FEATURES-DEBUG] subscriptionPackageId resolved as:', subscriptionPackageId);
  
  if (!subscriptionPackageId) {
    console.log('[TENANT-FEATURES-DEBUG] No subscription package ID found, returning default features');
    return DEFAULT_FEATURES;
  }

  const subscriptionPackage = await storage.getSubscriptionPackage(subscriptionPackageId);
  console.log('[TENANT-FEATURES-DEBUG] getSubscriptionPackage result:', subscriptionPackage ? 'found' : 'null', subscriptionPackage?.name || 'no-name');
  
  if (!subscriptionPackage) {
    console.log('[TENANT-FEATURES-DEBUG] Package not found, returning default features');
    return DEFAULT_FEATURES;
  }

  const isActive = subscriptionPackage.isActive ?? subscriptionPackage.is_active;
  console.log('[TENANT-FEATURES-DEBUG] Package isActive:', isActive);
  
  if (!isActive) {
    console.log('[TENANT-FEATURES-DEBUG] Package inactive, returning default features');
    return DEFAULT_FEATURES;
  }

  const packageFeatures = Array.isArray(subscriptionPackage.features) ? subscriptionPackage.features : [];
  
  if (packageFeatures.includes('everything')) {
    const allFeatureIds = Object.keys(AVAILABLE_FEATURES);
    return [...DEFAULT_FEATURES, ...allFeatureIds];
  }

  const validPackageFeatures = packageFeatures.filter(feature => 
    Object.keys(AVAILABLE_FEATURES).includes(feature)
  );

  return [...DEFAULT_FEATURES, ...validPackageFeatures];
}