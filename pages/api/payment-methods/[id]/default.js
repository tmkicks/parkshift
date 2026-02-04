import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { paymentService } from '../../../../lib/database';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });
  const { id } = req.query;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      // Set default payment method
      const { user_id } = req.body;

      if (user_id !== user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updatedPaymentMethod = await paymentService.setDefaultPaymentMethod(user.id, id);
      return res.status(200).json(updatedPaymentMethod);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Set default payment method API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
