export async function getTenantFeatures(tenantId: string): Promise<string[]> {
  const tenant = await storage.getTenant(tenantId);
  if (!tenant) {
    return DEFAULT_FEATURES;
  }

  const subscriptionPackageId = tenant.subscriptionPackageId || tenant.subscription_package_id;
  if (!subscriptionPackageId) {
    return DEFAULT_FEATURES;
  }

  const subscriptionPackage = await storage.getSubscriptionPackage(subscriptionPackageId);
  if (!subscriptionPackage || !subscriptionPackage.isActive) {
    return DEFAULT_FEATURES;
  }

  const packageFeatures = Array.isArray(subscriptionPackage.features) ? subscriptionPackage.features : [];

  if (packageFeatures.includes('everything')) {
    return [...new Set([...DEFAULT_FEATURES, ...Object.keys(AVAILABLE_FEATURES)])];
  }

  const validPackageFeatures = packageFeatures.filter(feature => 
    Object.keys(AVAILABLE_FEATURES).includes(feature)
  );

  return [...new Set([...DEFAULT_FEATURES, ...validPackageFeatures])];
}