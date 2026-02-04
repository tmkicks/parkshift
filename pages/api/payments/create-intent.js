import Stripe from 'stripe';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, booking_id, space_id, payment_method_id } = req.body;

    if (!amount || !booking_id) {
      return res.status(400).json({ error: 'Amount and booking_id are required' });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        space:parking_spaces(*, owner:profiles!parking_spaces_owner_id_fkey(*))
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Calculate platform fee (e.g., 10%)
    const platformFeeAmount = Math.round(amount * 0.10);
    const ownerAmount = amount - platformFeeAmount;

    // Create payment intent
    const paymentIntentData = {
      amount: amount,
      currency: 'eur',
      metadata: {
        booking_id: booking_id,
        space_id: space_id || booking.space_id,
        user_id: user.id,
        owner_id: booking.space.owner_id
      },
      description: `Parking space booking - ${booking.space.title}`,
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // If payment method is provided, attach it
    if (payment_method_id) {
      paymentIntentData.payment_method = payment_method_id;
      paymentIntentData.confirm = true;
    }

    // If using Stripe Connect for owner payouts
    if (booking.space.owner.stripe_account_id) {
      paymentIntentData.transfer_data = {
        destination: booking.space.owner.stripe_account_id,
        amount: ownerAmount,
      };
      paymentIntentData.application_fee_amount = platformFeeAmount;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return res.status(200).json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
}
