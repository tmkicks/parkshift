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
        return await getNotifications(supabase, user.id, req.query, res);
      case 'PUT':
        return await markAsRead(supabase, user.id, req.body, res);
      case 'DELETE':
        return await deleteNotification(supabase, user.id, req.query.id, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Notifications API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getNotifications(supabase, userId, query, res) {
  try {
    const { unread_only = false, limit = 50 } = query;

    let dbQuery = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (unread_only === 'true') {
      dbQuery = dbQuery.eq('is_read', false);
    }

    const { data, error } = await dbQuery;
    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

async function markAsRead(supabase, userId, { id, mark_all = false }, res) {
  try {
    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (!mark_all && id) {
      query = query.eq('id', id);
    } else if (!mark_all) {
      return res.status(400).json({ error: 'Notification ID required or set mark_all to true' });
    }

    const { data, error } = await query.select();
    if (error) throw error;

    return res.status(200).json({ 
      message: mark_all ? 'All notifications marked as read' : 'Notification marked as read',
      updated_count: data.length
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

async function deleteNotification(supabase, userId, notificationId, res) {
  try {
    if (!notificationId) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;

    return res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
}
