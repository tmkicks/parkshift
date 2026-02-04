import Stripe from 'stripe';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (req.method) {
      case 'GET':
        return await getPaymentMethods(supabase, user.id, res);
      case 'POST':
        return await createPaymentMethod(supabase, user.id, req.body, res);
      case 'PUT':
        return await updatePaymentMethod(supabase, user.id, req.body, res);
      case 'DELETE':
        return await deletePaymentMethod(supabase, user.id, req.query.id, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Payment methods API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getPaymentMethods(supabase, userId, res) {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
}

async function createPaymentMethod(supabase, userId, { payment_method_id }, res) {
  try {
    if (!payment_method_id) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }

    // Get payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);

    if (!paymentMethod.card) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Check payment method limit
    const { count } = await supabase
      .from('payment_methods')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count >= 5) {
      return res.status(400).json({ error: 'Maximum 5 payment methods allowed' });
    }

    // Set as default if it's the first payment method
    const isDefault = count === 0;

    // If setting as default, remove default from other methods
    if (isDefault) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    // Save to database
    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        user_id: userId,
        stripe_payment_method_id: payment_method_id,
        card_brand: paymentMethod.card.brand,
        card_last4: paymentMethod.card.last4,
        card_exp_month: paymentMethod.card.exp_month,
        card_exp_year: paymentMethod.card.exp_year,
        is_default: isDefault
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating payment method:', error);
    return res.status(500).json({ error: 'Failed to create payment method' });
  }
}

async function updatePaymentMethod(supabase, userId, { id, is_default }, res) {
  try {
    if (!id) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }

    // If setting as default, remove default from other methods
    if (is_default) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', id);
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .update({ is_default })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating payment method:', error);
    return res.status(500).json({ error: 'Failed to update payment method' });
  }
}

async function deletePaymentMethod(supabase, userId, methodId, res) {
  try {
    if (!methodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }

    // Get payment method details
    const { data: paymentMethod } = await supabase
      .from('payment_methods')
      .select('stripe_payment_method_id, is_default')
      .eq('id', methodId)
      .eq('user_id', userId)
      .single();

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Detach from Stripe
    try {
      await stripe.paymentMethods.detach(paymentMethod.stripe_payment_method_id);
    } catch (stripeError) {
      console.warn('Failed to detach payment method from Stripe:', stripeError);
    }

    // Delete from database
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', methodId)
      .eq('user_id', userId);

    if (error) throw error;

    // If deleted method was default, make another method default
    if (paymentMethod.is_default) {
      const { data: remainingMethods } = await supabase
        .from('payment_methods')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (remainingMethods && remainingMethods.length > 0) {
        await supabase
          .from('payment_methods')
          .update({ is_default: true })
          .eq('id', remainingMethods[0].id);
      }
    }

    return res.status(200).json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return res.status(500).json({ error: 'Failed to delete payment method' });
  }
}
