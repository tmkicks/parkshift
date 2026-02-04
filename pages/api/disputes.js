import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { notificationService } from '../../lib/database';
import { stripeService } from '../../lib/stripe';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      // Create new dispute
      const {
        booking_id,
        respondent_id,
        reason,
        description,
        evidence_files = []
      } = req.body;

      // Validate required fields
      if (!booking_id || !respondent_id || !reason || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify user is part of this booking
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          space:parking_spaces(owner_id, title)
        `)
        .eq('id', booking_id)
        .single();

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const isRenter = booking.renter_id === user.id;
      const isOwner = booking.space.owner_id === user.id;

      if (!isRenter && !isOwner) {
        return res.status(403).json({ error: 'Not authorized for this booking' });
      }

      // Check if dispute already exists
      const { data: existingDispute } = await supabase
        .from('disputes')
        .select('id')
        .eq('booking_id', booking_id)
        .single();

      if (existingDispute) {
        return res.status(400).json({ error: 'Dispute already exists for this booking' });
      }

      // Create dispute
      const disputeData = {
        booking_id,
        complainant_id: user.id,
        respondent_id,
        reason,
        description,
        evidence_files,
        status: 'open'
      };

      const { data: dispute, error } = await supabase
        .from('disputes')
        .insert(disputeData)
        .select()
        .single();

      if (error) throw error;

      // Create notifications
      await notificationService.createNotification({
        user_id: respondent_id,
        type: 'dispute',
        title: 'Dispute Opened',
        message: `A dispute has been opened for booking #${booking_id}`,
        data: {
          dispute_id: dispute.id,
          booking_id,
          reason
        }
      });

      // Set up auto-refund timer (48 hours)
      const autoRefundTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
      
      // In a production environment, you'd set up a scheduled job
      // For now, we'll just store the timestamp
      await supabase
        .from('disputes')
        .update({ 
          auto_refund_at: autoRefundTime.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', dispute.id);

      return res.status(201).json(dispute);
    }

    if (req.method === 'GET') {
      // Get user's disputes
      const { data: disputes } = await supabase
        .from('disputes')
        .select(`
          *,
          booking:bookings(
            id,
            total_amount,
            start_datetime,
            end_datetime,
            space:parking_spaces(title)
          ),
          complainant:profiles!complainant_id(first_name, last_name),
          respondent:profiles!respondent_id(first_name, last_name)
        `)
        .or(`complainant_id.eq.${user.id},respondent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      return res.status(200).json(disputes || []);
    }

    if (req.method === 'PATCH') {
      // Update dispute status
      const { dispute_id, status, resolution, refund_amount } = req.body;

      if (!dispute_id || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get dispute details
      const { data: dispute } = await supabase
        .from('disputes')
        .select(`
          *,
          booking:bookings(stripe_payment_intent_id, total_amount)
        `)
        .eq('id', dispute_id)
        .single();

      if (!dispute) {
        return res.status(404).json({ error: 'Dispute not found' });
      }

      // Update dispute
      const updates = {
        status,
        resolution: resolution || null,
        refund_amount: refund_amount || null,
        updated_at: new Date().toISOString()
      };

      const { data: updatedDispute, error } = await supabase
        .from('disputes')
        .update(updates)
        .eq('id', dispute_id)
        .select()
        .single();

      if (error) throw error;

      // Process refund if approved
      if (status === 'resolved' && refund_amount > 0) {
        try {
          await stripeService.createRefund(
            dispute.booking.stripe_payment_intent_id,
            refund_amount * 100 // Convert to cents
          );

          // Create notifications
          await notificationService.createNotification({
            user_id: dispute.complainant_id,
            type: 'payment',
            title: 'Refund Processed',
            message: `Your refund of €${refund_amount} has been processed`,
            data: { dispute_id, refund_amount }
          });
        } catch (refundError) {
          console.error('Refund error:', refundError);
          // Continue without failing the dispute update
        }
      }

      return res.status(200).json(updatedDispute);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Disputes API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
