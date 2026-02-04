import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient, createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { Send, Paperclip, Image, File, Phone, MoreVertical, Car, MapPin } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';
import { messageService } from '../lib/database';

export default function MessageInterface({ userId, bookingId = null, spaceId = null }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    if (userId) {
      loadConversations();
      subscribeToMessages();
    }
  }, [userId]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      markMessagesAsRead(activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await messageService.getConversations(supabase, userId);
      setConversations(data);

      // Auto-select conversation if bookingId is provided
      if (bookingId) {
        const bookingConversation = data.find(c => c.booking_id === bookingId);
        if (bookingConversation) {
          setActiveConversation(bookingConversation);
        }
      } else if (data.length > 0) {
        setActiveConversation(data[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .order('created_at', { ascending: true });

      if (conversationId.startsWith('direct_')) {
        // Direct conversation
        const userIds = conversationId.replace('direct_', '').split('_');
        query = query.or(`and(sender_id.eq.${userIds[0]},recipient_id.eq.${userIds[1]}),and(sender_id.eq.${userIds[1]},recipient_id.eq.${userIds[0]})`);
      } else {
        // Booking conversation
        query = query.eq('booking_id', conversationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId) => {
    try {
      let query = supabase
        .from('messages')
        .update({ is_read: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (conversationId.startsWith('direct_')) {
        query = query.is('booking_id', null);
      } else {
        query = query.eq('booking_id', conversationId);
      }

      await query;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(sender_id.eq.${userId},recipient_id.eq.${userId})`
      }, (payload) => {
        const newMessage = payload.new;
        
        // Add to messages if it's for the active conversation
        if (activeConversation) {
          const isForActiveConversation = 
            (activeConversation.booking_id && newMessage.booking_id === activeConversation.booking_id) ||
            (activeConversation.id.startsWith('direct_') && !newMessage.booking_id);

          if (isForActiveConversation) {
            setMessages(prev => [...prev, newMessage]);
            markMessagesAsRead(activeConversation.id);
          }
        }

        // Refresh conversations list
        loadConversations();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    setSending(true);
    try {
      const messageData = {
        sender_id: userId,
        recipient_id: activeConversation.other_user.id,
        content: newMessage.trim(),
        message_type: 'text'
      };

      if (activeConversation.booking_id) {
        messageData.booking_id = activeConversation.booking_id;
      }

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!activeConversation) return;

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36)}.${fileExt}`;
      const bucket = file.type.startsWith('image/') ? 'images' : 'files';

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const messageData = {
        sender_id: userId,
        recipient_id: activeConversation.other_user.id,
        content: file.name,
        message_type: file.type.startsWith('image/') ? 'image' : 'file',
        file_url: publicUrl,
        file_name: file.name
      };

      if (activeConversation.booking_id) {
        messageData.booking_id = activeConversation.booking_id;
      }

      const { error: messageError } = await supabase
        .from('messages')
        .insert(messageData);

      if (messageError) throw messageError;

      toast.success('File sent successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-96 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Messages</h3>
        </div>
        
        <div className="overflow-y-auto h-full">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setActiveConversation(conversation)}
                className={`p-4 border-b border-gray-100 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  activeConversation?.id === conversation.id ? 'bg-green-50 dark:bg-green-900/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                    {conversation.other_user.avatar_url ? (
                      <img
                        src={conversation.other_user.avatar_url}
                        alt={`${conversation.other_user.first_name} ${conversation.other_user.last_name}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                        {conversation.other_user.first_name?.[0]}{conversation.other_user.last_name?.[0]}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {conversation.other_user.first_name} {conversation.other_user.last_name}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMessageTime(conversation.last_message.created_at)}
                      </span>
                    </div>
                    
                    {conversation.booking && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <Car size={12} />
                        <span className="truncate">{conversation.booking.space.title}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {conversation.last_message.message_type === 'image' ? '📷 Photo' :
                         conversation.last_message.message_type === 'file' ? '📎 File' :
                         conversation.last_message.content}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="bg-green-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    {activeConversation.other_user.avatar_url ? (
                      <img
                        src={activeConversation.other_user.avatar_url}
                        alt={`${activeConversation.other_user.first_name} ${activeConversation.other_user.last_name}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                        {activeConversation.other_user.first_name?.[0]}{activeConversation.other_user.last_name?.[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {activeConversation.other_user.first_name} {activeConversation.other_user.last_name}
                    </p>
                    {activeConversation.booking && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin size={12} />
                        <span>{activeConversation.booking.space.title}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Phone size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === userId
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}>
                    {message.message_type === 'image' ? (
                      <div>
                        <img
                          src={message.file_url}
                          alt={message.file_name}
                          className="rounded-lg max-w-full h-auto"
                        />
                        <p className="text-xs mt-1 opacity-75">{formatMessageTime(message.created_at)}</p>
                      </div>
                    ) : message.message_type === 'file' ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <File size={16} />
                          <a
                            href={message.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:no-underline"
                          >
                            {message.file_name}
                          </a>
                        </div>
                        <p className="text-xs mt-1 opacity-75">{formatMessageTime(message.created_at)}</p>
                      </div>
                    ) : (
                      <div>
                        <p>{message.content}</p>
                        <p className="text-xs mt-1 opacity-75">{formatMessageTime(message.created_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                >
                  <Paperclip size={20} />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={sending}
                  />
                </div>
                
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
