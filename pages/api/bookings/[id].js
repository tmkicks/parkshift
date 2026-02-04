import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { bookingService } from '../../../lib/database';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });
  const { id } = req.query;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get booking details
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          space:parking_spaces(
            id,
            title,
            address,
            images,
            access_instructions,
            owner_id,
            owner:profiles!owner_id(first_name, last_name, phone)
          ),
          vehicle:vehicles(make, model, year, license_plate),
          renter:profiles!renter_id(first_name, last_name, phone)
        `)
        .eq('id', id)
        .single();

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check if user has access to this booking
      const hasAccess = booking.renter_id === user.id || booking.space.owner_id === user.id;
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.status(200).json(booking);
    }

    if (req.method === 'PATCH') {
      // Update booking status
      const { status } = req.body;
      
      const updatedBooking = await bookingService.updateBookingStatus(id, status);
      return res.status(200).json(updatedBooking);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Booking API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
