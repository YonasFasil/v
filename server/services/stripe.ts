import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export interface CreateProductData {
  name: string;
  slug: string;
  billingModes: {
    monthly?: { amount: number; currency: string };
    yearly?: { amount: number; currency: string };
  };
}

export interface StripeProductResult {
  productId: string;
  priceIds: {
    monthly?: string;
    yearly?: string;
  };
}

export class StripeService {
  /**
   * Create or update Stripe product and prices for a feature package
   * Idempotent by slug - will update existing product if found
   */
  async syncFeaturePackage(data: CreateProductData): Promise<StripeProductResult> {
    // Check if product already exists by metadata slug
    const existingProducts = await stripe.products.list({
      limit: 100,
      active: true,
    });
    
    let product = existingProducts.data.find(p => p.metadata.slug === data.slug);
    
    if (product) {
      // Update existing product
      product = await stripe.products.update(product.id, {
        name: data.name,
        active: true,
        metadata: { slug: data.slug }
      });
    } else {
      // Create new product
      product = await stripe.products.create({
        name: data.name,
        type: 'service',
        metadata: { slug: data.slug }
      });
    }

    const priceIds: { monthly?: string; yearly?: string } = {};

    // Handle monthly pricing
    if (data.billingModes.monthly) {
      const monthlyPrice = await this.createOrUpdatePrice(
        product.id,
        data.billingModes.monthly.amount,
        data.billingModes.monthly.currency,
        'month',
        data.slug
      );
      priceIds.monthly = monthlyPrice.id;
    }

    // Handle yearly pricing
    if (data.billingModes.yearly) {
      const yearlyPrice = await this.createOrUpdatePrice(
        product.id,
        data.billingModes.yearly.amount,
        data.billingModes.yearly.currency,
        'year',
        data.slug
      );
      priceIds.yearly = yearlyPrice.id;
    }

    return {
      productId: product.id,
      priceIds
    };
  }

  private async createOrUpdatePrice(
    productId: string,
    amount: number,
    currency: string,
    interval: 'month' | 'year',
    slug: string
  ): Promise<Stripe.Price> {
    // Check for existing price
    const existingPrices = await stripe.prices.list({
      product: productId,
      active: true,
      type: 'recurring',
    });

    const existingPrice = existingPrices.data.find(p => 
      p.recurring?.interval === interval && 
      p.metadata.slug === slug
    );

    if (existingPrice && existingPrice.unit_amount === amount) {
      // Price exists and amount matches, return it
      return existingPrice;
    }

    if (existingPrice) {
      // Deactivate old price (Stripe doesn't allow updating price amounts)
      await stripe.prices.update(existingPrice.id, { active: false });
    }

    // Create new price
    return await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency: currency.toLowerCase(),
      recurring: { interval },
      metadata: { slug, interval }
    });
  }

  /**
   * Create Stripe Checkout Session for subscription signup
   */
  async createCheckoutSession(
    priceId: string,
    customerEmail: string,
    metadata: Record<string, string>,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    return await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      subscription_data: {
        metadata,
      }
    });
  }

  /**
   * Create Stripe Customer Portal session for managing subscription
   */
  async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice', 'customer']
    });
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    return await stripe.customers.retrieve(customerId) as Stripe.Customer;
  }
}

export const stripeService = new StripeService();