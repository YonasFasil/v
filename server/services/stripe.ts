import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key', {
  apiVersion: '2024-06-20',
});

export interface CreateCustomerData {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionData {
  customerId: string;
  priceId: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionData {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
}

export class StripeService {
  // Create a Stripe customer
  async createCustomer(data: CreateCustomerData): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email: data.email,
        name: data.name,
        metadata: data.metadata || {},
      });
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  // Create a subscription
  async createSubscription(data: CreateSubscriptionData): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: data.customerId,
        items: [
          {
            price: data.priceId,
          },
        ],
        trial_period_days: data.trialPeriodDays,
        metadata: data.metadata || {},
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      return subscription;
    } catch (error) {
      console.error('Error creating Stripe subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  // Create a checkout session
  async createCheckoutSession(data: CreateCheckoutSessionData): Promise<Stripe.Checkout.Session> {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: data.customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: data.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        subscription_data: {
          trial_period_days: data.trialPeriodDays,
          metadata: data.metadata || {},
        },
        allow_promotion_codes: true,
      });
      return session;
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  // Get customer by ID
  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      console.error('Error retrieving Stripe customer:', error);
      return null;
    }
  }

  // Get subscription by ID
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error retrieving Stripe subscription:', error);
      return null;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error canceling Stripe subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  // Update subscription
  async updateSubscription(
    subscriptionId: string,
    data: { priceId?: string; metadata?: Record<string, string> }
  ): Promise<Stripe.Subscription> {
    try {
      const updateData: Stripe.SubscriptionUpdateParams = {};
      
      if (data.priceId) {
        updateData.items = [{ price: data.priceId }];
      }
      
      if (data.metadata) {
        updateData.metadata = data.metadata;
      }

      const subscription = await stripe.subscriptions.update(subscriptionId, updateData);
      return subscription;
    } catch (error) {
      console.error('Error updating Stripe subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  // Handle webhook events
  async handleWebhook(payload: string, signature: string): Promise<Stripe.Event | null> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      return null;
    }
  }

  // Create price for subscription package
  async createPrice(data: {
    productId: string;
    amount: number; // in cents
    currency: string;
    interval: 'month' | 'year';
    metadata?: Record<string, string>;
  }): Promise<Stripe.Price> {
    try {
      const price = await stripe.prices.create({
        product: data.productId,
        unit_amount: data.amount,
        currency: data.currency,
        recurring: {
          interval: data.interval,
        },
        metadata: data.metadata || {},
      });
      return price;
    } catch (error) {
      console.error('Error creating Stripe price:', error);
      throw new Error('Failed to create price');
    }
  }

  // Create product for subscription package
  async createProduct(data: {
    name: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Product> {
    try {
      const product = await stripe.products.create({
        name: data.name,
        description: data.description,
        metadata: data.metadata || {},
      });
      return product;
    } catch (error) {
      console.error('Error creating Stripe product:', error);
      throw new Error('Failed to create product');
    }
  }
}

export const stripeService = new StripeService();