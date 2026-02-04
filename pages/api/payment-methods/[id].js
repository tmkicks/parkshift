import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { stripeService } from '../../../lib/stripe';
import { paymentService } from '../../../lib/database';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: paymentMethodId } = req.query;

    if (req.method === 'DELETE') {
      if (!paymentMethodId) {
        return res.status(400).json({ error: 'Payment method ID is required' });
      }

      // Get the payment method from database to verify ownership
      const paymentMethods = await paymentService.getUserPaymentMethods(supabase, user.id);
      const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);

      if (!paymentMethod) {
        return res.status(404).json({ error: 'Payment method not found' });
      }

      // Check if it's the default payment method
      if (paymentMethod.is_default) {
        return res.status(400).json({ error: 'Cannot delete default payment method. Set another as default first.' });
      }

      // Delete from Stripe first
      try {
        await stripeService.deletePaymentMethod(paymentMethod.stripe_payment_method_id);
      } catch (stripeError) {
        console.error('Stripe deletion error:', stripeError);
        // Continue with database deletion even if Stripe fails
      }

      // Delete from database
      await paymentService.deletePaymentMethod(supabase, paymentMethodId);

      res.status(200).json({ success: true });
    } else {
      res.setHeader('Allow', ['DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Delete payment method API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
