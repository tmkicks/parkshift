import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { spaceService, notificationService } from '../../../lib/database';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });
  const { id } = req.query;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get space details
      const space = await spaceService.getSpaceById(id);
      if (!space) {
        return res.status(404).json({ error: 'Space not found' });
      }
      return res.status(200).json(space);
    }

    if (req.method === 'PUT') {
      // Update space
      const updates = req.body;
      
      // Verify ownership
      const space = await spaceService.getSpaceById(id);
      if (!space || space.owner_id !== user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updatedSpace = await spaceService.updateSpace(id, updates);
      
      // Notify active renters if significant changes
      if (updates.address || updates.access_instructions) {
        // TODO: Notify current renters about changes
      }

      return res.status(200).json(updatedSpace);
    }

    if (req.method === 'DELETE') {
      // Delete space
      const space = await spaceService.getSpaceById(id);
      if (!space || space.owner_id !== user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Check for active bookings
      const { data: activeBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('space_id', id)
        .in('status', ['confirmed', 'active'])
        .gte('end_datetime', new Date().toISOString());

      if (activeBookings && activeBookings.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete space with active bookings' 
        });
      }

      await spaceService.deleteSpace(id);
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PATCH') {
      // Toggle space status (active/inactive)
      const { is_active } = req.body;
      
      const space = await spaceService.getSpaceById(id);
      if (!space || space.owner_id !== user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updatedSpace = await spaceService.updateSpace(id, { is_active });
      
      // Create notification
      await notificationService.createNotification({
        user_id: user.id,
        type: 'listing',
        title: `Listing ${is_active ? 'Activated' : 'Paused'}`,
        message: `Your parking space "${space.title}" is now ${is_active ? 'active' : 'paused'}`,
        data: { space_id: id }
      });

      return res.status(200).json(updatedSpace);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Space API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
