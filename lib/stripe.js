import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Client-side Stripe instance
let stripePromise;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Server-side Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Stripe utility functions
export const stripeService = {
  // Create customer
  async createCustomer(email, name) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          source: 'parkshift'
        }
      });
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  },

  // Create payment method
  async attachPaymentMethod(paymentMethodId, customerId) {
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      return true;
    } catch (error) {
      console.error('Error attaching payment method:', error);
      throw error;
    }
  },

  // Create payment intent
  async createPaymentIntent(amount, currency = 'eur', customerId, metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  // Create Connect account for owners
  async createConnectAccount(email, country = 'BE') {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      return account;
    } catch (error) {
      console.error('Error creating Connect account:', error);
      throw error;
    }
  },

  // Create account link for onboarding
  async createAccountLink(accountId, refreshUrl, returnUrl) {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });
      return accountLink;
    } catch (error) {
      console.error('Error creating account link:', error);
      throw error;
    }
  },

  // Transfer funds to connected account
  async createTransfer(amount, destination, metadata = {}) {
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: 'eur',
        destination,
        metadata,
      });
      return transfer;
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw error;
    }
  },

  // Get payment methods for customer
  async getCustomerPaymentMethods(customerId) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  },

  // Delete payment method
  async deletePaymentMethod(paymentMethodId) {
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
      return true;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  },

  // Create refund
  async createRefund(paymentIntentId, amount, reason = 'requested_by_customer') {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount, // Amount in cents
        reason
      });
      return refund;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  },

  // Calculate platform fee (5% of booking amount)
  calculatePlatformFee(amount) {
    return Math.round(amount * 0.05 * 100) / 100; // 5% fee
  }
};

export { stripe };
export default getStripe;
