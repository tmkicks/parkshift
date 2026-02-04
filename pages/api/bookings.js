import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (req.method) {
      case 'GET':
        return await getBookings(supabase, user.id, req.query, res);
      case 'POST':
        return await createBooking(supabase, user.id, req.body, res);
      case 'PUT':
        return await updateBooking(supabase, user.id, req.body, res);
      case 'DELETE':
        return await cancelBooking(supabase, user.id, req.query.id, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Bookings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getBookings(supabase, userId, query, res) {
  try {
    const { type = 'renter' } = query; // 'renter' or 'owner'

    let dbQuery = supabase
      .from('bookings')
      .select(`
        *,
        space:parking_spaces(*),
        renter:profiles!bookings_renter_id_fkey(first_name, last_name, avatar_url, phone),
        vehicle:vehicles(*)
      `)
      .order('created_at', { ascending: false });

    if (type === 'renter') {
      dbQuery = dbQuery.eq('renter_id', userId);
    } else {
      // Get bookings for spaces owned by user
      dbQuery = dbQuery.eq('space.owner_id', userId);
    }

    const { data, error } = await dbQuery;
    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

async function createBooking(supabase, userId, bookingData, res) {
  try {
    const {
      space_id,
      vehicle_id,
      start_datetime,
      end_datetime,
      total_amount,
      special_requests
    } = bookingData;

    if (!space_id || !vehicle_id || !start_datetime || !end_datetime || !total_amount) {
      return res.status(400).json({ error: 'Missing required booking data' });
    }

    // Check if space is available
    const { data: conflictingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('space_id', space_id)
      .neq('status', 'cancelled')
      .or(`start_datetime.lte.${end_datetime},end_datetime.gte.${start_datetime}`);

    if (conflictingBookings && conflictingBookings.length > 0) {
      return res.status(400).json({ error: 'Space is not available for selected time' });
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        space_id,
        renter_id: userId,
        vehicle_id,
        start_datetime,
        end_datetime,
        total_amount,
        special_requests,
        status: 'pending'
      })
      .select(`
        *,
        space:parking_spaces(*),
        vehicle:vehicles(*)
      `)
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
}

async function updateBooking(supabase, userId, bookingData, res) {
  try {
    const { id, status, ...updateData } = bookingData;

    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Get booking to check ownership
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        space:parking_spaces(owner_id)
      `)
      .eq('id', id)
      .single();

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user can update this booking
    const canUpdate = booking.renter_id === userId || booking.space.owner_id === userId;
    if (!canUpdate) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({
        ...updateData,
        ...(status && { status }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        space:parking_spaces(*),
        renter:profiles!bookings_renter_id_fkey(first_name, last_name),
        vehicle:vehicles(*)
      `)
      .single();

    if (error) throw error;

    // Create notifications for status changes
    if (status) {
      const notifications = [];
      
      if (status === 'confirmed' && booking.renter_id !== userId) {
        notifications.push({
          user_id: booking.renter_id,
          type: 'booking',
          title: 'Booking Confirmed',
          message: `Your booking for "${data.space.title}" has been confirmed`,
          data: { booking_id: id }
        });
      } else if (status === 'cancelled') {
        const otherUserId = booking.renter_id === userId ? booking.space.owner_id : booking.renter_id;
        notifications.push({
          user_id: otherUserId,
          type: 'booking',
          title: 'Booking Cancelled',
          message: `A booking for "${data.space.title}" has been cancelled`,
          data: { booking_id: id }
        });
      }

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating booking:', error);
    return res.status(500).json({ error: 'Failed to update booking' });
  }
}

async function cancelBooking(supabase, userId, bookingId, res) {
  try {
    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        space:parking_spaces(owner_id, title)
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user can cancel this booking
    const canCancel = booking.renter_id === userId || booking.space.owner_id === userId;
    if (!canCancel) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    // Update booking status
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;

    // Handle refund if payment was processed
    if (booking.stripe_payment_intent_id && booking.status === 'confirmed') {
      // TODO: Implement refund logic with Stripe
      // This would be handled by the dispute system
    }

    // Notify the other party
    const otherUserId = booking.renter_id === userId ? booking.space.owner_id : booking.renter_id;
    await supabase
      .from('notifications')
      .insert({
        user_id: otherUserId,
        type: 'booking',
        title: 'Booking Cancelled',
        message: `A booking for "${booking.space.title}" has been cancelled`,
        data: { booking_id: bookingId }
      });

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({ error: 'Failed to cancel booking' });
  }
}
