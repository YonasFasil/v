async getSubscriptionPackage(id: string): Promise<any> {
    const result = await this.db.select({
      id: subscriptionPackages.id,
      name: subscriptionPackages.name,
      description: subscriptionPackages.description,
      price: subscriptionPackages.price,
      billingInterval: subscriptionPackages.billingInterval,
      maxVenues: subscriptionPackages.maxVenues,
      maxUsers: subscriptionPackages.maxUsers,
      features: subscriptionPackages.features,
      isActive: subscriptionPackages.isActive,
      sortOrder: subscriptionPackages.sortOrder,
      createdAt: subscriptionPackages.createdAt,
    }).from(subscriptionPackages).where(eq(subscriptionPackages.id, id)).limit(1);
    return result[0];
  }