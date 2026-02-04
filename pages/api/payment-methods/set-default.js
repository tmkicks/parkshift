import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { paymentService } from '../../../lib/database';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const { paymentMethodId } = req.body;

      if (!paymentMethodId) {
        return res.status(400).json({ error: 'Payment method ID is required' });
      }

      // Set as default in database
      const updatedPaymentMethod = await paymentService.setDefaultPaymentMethod(
        supabase, 
        user.id, 
        paymentMethodId
      );

      res.status(200).json(updatedPaymentMethod);
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Set default payment method API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}