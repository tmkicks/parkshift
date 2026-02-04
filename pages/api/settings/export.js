import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Collect all user data
      const userData = {
        profile: null,
        vehicles: [],
        paymentMethods: [],
        bookings: [],
        listings: [],
        messages: [],
        reviews: [],
        disputes: [],
        notifications: []
      };

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      userData.profile = profile;

      // Get vehicles
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id);
      userData.vehicles = vehicles || [];

      // Get payment methods (excluding sensitive data)
      const { data: paymentMethods } = await supabase
        .from('payment_methods')
        .select('card_brand, card_last4, card_exp_month, card_exp_year, is_default, created_at')
        .eq('user_id', user.id);
      userData.paymentMethods = paymentMethods || [];

      // Get bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          space:parking_spaces(title, address)
        `)
        .eq('renter_id', user.id);
      userData.bookings = bookings || [];

      // Get listings
      const { data: listings } = await supabase
        .from('parking_spaces')
        .select('*')
        .eq('owner_id', user.id);
      userData.listings = listings || [];

      // Get messages (content only, no metadata)
      const { data: messages } = await supabase
        .from('messages')
        .select('content, message_type, created_at')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
      userData.messages = messages || [];

      // Get reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewer_id', user.id);
      userData.reviews = reviews || [];

      // Get disputes
      const { data: disputes } = await supabase
        .from('disputes')
        .select('*')
        .or(`complainant_id.eq.${user.id},respondent_id.eq.${user.id}`);
      userData.disputes = disputes || [];

      // Get notifications
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id);
      userData.notifications = notifications || [];

      // Add export metadata
      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        export_version: '1.0',
        data: userData
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="parkshift-data-${user.id}-${new Date().toISOString().split('T')[0]}.json"`);
      return res.status(200).json(exportData);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Export API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
