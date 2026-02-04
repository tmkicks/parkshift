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
        return await getMessages(supabase, user.id, req.query, res);
      case 'POST':
        return await createMessage(supabase, user.id, req.body, res);
      case 'PUT':
        return await updateMessage(supabase, user.id, req.body, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Messages API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getMessages(supabase, userId, query, res) {
  const { conversation_id, booking_id, other_user_id } = query;

  try {
    let dbQuery = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .order('created_at', { ascending: true });

    if (booking_id) {
      // Get messages for a specific booking
      dbQuery = dbQuery.eq('booking_id', booking_id);
    } else if (other_user_id) {
      // Get direct messages between two users
      dbQuery = dbQuery
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${other_user_id}),and(sender_id.eq.${other_user_id},recipient_id.eq.${userId})`)
        .is('booking_id', null);
    } else {
      // Get all conversations for user
      dbQuery = dbQuery.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    }

    const { data, error } = await dbQuery;
    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

async function createMessage(supabase, userId, messageData, res) {
  try {
    const { recipient_id, content, message_type = 'text', booking_id, file_url, file_name } = messageData;

    if (!recipient_id || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }

    const newMessage = {
      sender_id: userId,
      recipient_id,
      content,
      message_type,
      file_url,
      file_name,
      booking_id: booking_id || null
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(newMessage)
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Create notification for recipient
    await supabase
      .from('notifications')
      .insert({
        user_id: recipient_id,
        type: 'message',
        title: 'New Message',
        message: `You have a new message from ${data.sender.first_name}`,
        data: { message_id: data.id, sender_id: userId }
      });

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating message:', error);
    return res.status(500).json({ error: 'Failed to create message' });
  }
}

async function updateMessage(supabase, userId, messageData, res) {
  try {
    const { id, is_read } = messageData;

    if (!id) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    // Only allow updating if user is the recipient
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read })
      .eq('id', id)
      .eq('recipient_id', userId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating message:', error);
    return res.status(500).json({ error: 'Failed to update message' });
  }
}
