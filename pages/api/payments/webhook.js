import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  const bookingId = paymentIntent.metadata.booking_id;
  
  if (bookingId) {
    // Update booking status
    await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        stripe_payment_intent_id: paymentIntent.id
      })
      .eq('id', bookingId);

    // Create notifications
    const booking = await supabase
      .from('bookings')
      .select(`
        *,
        space:parking_spaces(*),
        renter:profiles!bookings_renter_id_fkey(*)
      `)
      .eq('id', bookingId)
      .single();

    if (booking.data) {
      // Notify space owner
      await supabase
        .from('notifications')
        .insert({
          user_id: paymentIntent.metadata.owner_id,
          type: 'booking',
          title: 'Booking Confirmed',
          message: `Your space "${booking.data.space.title}" has been booked by ${booking.data.renter.first_name}`,
          data: { booking_id: bookingId }
        });

      // Notify renter
      await supabase
        .from('notifications')
        .insert({
          user_id: paymentIntent.metadata.user_id,
          type: 'booking',
          title: 'Payment Successful',
          message: `Your booking for "${booking.data.space.title}" has been confirmed`,
          data: { booking_id: bookingId }
        });
    }
  }
}

async function handlePaymentFailed(paymentIntent) {
  const bookingId = paymentIntent.metadata.booking_id;
  
  if (bookingId) {
    // Update booking status
    await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    // Notify user
    await supabase
      .from('notifications')
      .insert({
        user_id: paymentIntent.metadata.user_id,
        type: 'booking',
        title: 'Payment Failed',
        message: 'Your booking payment failed. Please try again.',
        data: { booking_id: bookingId }
      });
  }
}
