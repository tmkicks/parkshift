import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { stripeService } from '../../lib/stripe';
import { paymentService, profileService } from '../../lib/database';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const paymentMethods = await paymentService.getUserPaymentMethods(supabase, user.id);
      res.status(200).json(paymentMethods);
    } else if (req.method === 'POST') {
      const { paymentMethodId } = req.body;

      console.log('API received request body:', req.body);
      console.log('Extracted paymentMethodId:', paymentMethodId);

      if (!paymentMethodId) {
        console.error('Missing paymentMethodId in request');
        return res.status(400).json({ error: 'Payment method ID is required' });
      }

      // Get user profile to check for stripe customer
      const profile = await profileService.getProfile(supabase, user.id);
      
      // Get existing payment methods
      const existingMethods = await paymentService.getUserPaymentMethods(supabase, user.id);

      let stripeCustomerId = profile.stripe_customer_id;

      // Create Stripe customer if doesn't exist
      if (!stripeCustomerId) {
        const customer = await stripeService.createCustomer(
          user.email,
          `${profile.first_name} ${profile.last_name}`.trim()
        );
        stripeCustomerId = customer.id;

        // Update profile with stripe customer ID
        await profileService.updateProfile(supabase, user.id, {
          stripe_customer_id: stripeCustomerId
        });
      }

      // Attach payment method to customer
      await stripeService.attachPaymentMethod(paymentMethodId, stripeCustomerId);

      // Get payment method details from Stripe
      const stripePaymentMethods = await stripeService.getCustomerPaymentMethods(stripeCustomerId);
      const newPaymentMethod = stripePaymentMethods.find(pm => pm.id === paymentMethodId);

      if (!newPaymentMethod) {
        throw new Error('Payment method not found');
      }

      // Save to database
      const paymentMethodData = {
        user_id: user.id,
        stripe_payment_method_id: paymentMethodId,
        card_brand: newPaymentMethod.card.brand,
        card_last4: newPaymentMethod.card.last4,
        card_exp_month: newPaymentMethod.card.exp_month,
        card_exp_year: newPaymentMethod.card.exp_year,
        is_default: existingMethods.length === 0 // First payment method is default
      };

      const savedPaymentMethod = await paymentService.addPaymentMethod(supabase, paymentMethodData);
      res.status(201).json(savedPaymentMethod);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Payment methods API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
