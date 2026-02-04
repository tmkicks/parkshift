import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Image as ImageIcon, X, Download, Phone, Info } from 'lucide-react';
import { messageService } from '../lib/database';
import { createClientComponentClient, createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

export default function ChatWindow({ chat, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    if (chat) {
      loadMessages();
      markAsRead();
    }
  }, [chat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!chat) return;

    const subscription = supabase
      .channel(`chat_${chat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: chat.booking_id 
            ? `booking_id=eq.${chat.booking_id}`
            : `and(sender_id=eq.${user.id},recipient_id=eq.${chat.participant.id}),and(sender_id=eq.${chat.participant.id},recipient_id=eq.${user.id})`
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages(prev => [...prev, {
            ...newMsg,
            sender: newMsg.sender_id === user.id ? 
              { id: user.id, first_name: 'You' } : 
              chat.participant
          }]);
          
          // Mark as read if message is from other person
          if (newMsg.sender_id !== user.id) {
            markAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [chat, user.id, supabase]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await messageService.getMessages(
        supabase,
        chat.booking_id,
        user.id,
        chat.participant.id
      );
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      const unreadMessages = messages.filter(msg => 
        !msg.is_read && msg.sender_id !== user.id
      );
      
      if (unreadMessages.length > 0) {
        await messageService.markAsRead(unreadMessages.map(msg => msg.id));
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const messageData = {
        content: newMessage.trim(),
        sender_id: user.id,
        recipient_id: chat.participant.id,
        booking_id: chat.booking_id || null,
        message_type: 'text'
      };

      await messageService.sendMessage(supabase, messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        // Upload file to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `messages/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(filePath);

        // Send message with file
        const messageData = {
          content: file.name,
          sender_id: user.id,
          recipient_id: chat.participant.id,
          booking_id: chat.booking_id || null,
          message_type: file.type.startsWith('image/') ? 'image' : 'file',
          file_url: publicUrl,
          file_name: file.name
        };

        await messageService.sendMessage(supabase, messageData);
      }
      
      toast.success('File(s) sent successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return `Today at ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd/MM/yyyy at HH:mm');
    }
  };

  const generateInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  const generateAvatarColor = (userId) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = userId?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a conversation to start messaging
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden">
            {chat.participant?.avatar_url ? (
              <img
                src={chat.participant.avatar_url}
                alt={`${chat.participant.first_name} ${chat.participant.last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-white text-sm font-bold ${generateAvatarColor(chat.participant?.id)}`}>
                {generateInitials(chat.participant?.first_name, chat.participant?.last_name)}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">
              {chat.participant?.first_name} {chat.participant?.last_name}
            </h3>
            {chat.booking_id && (
              <p className="text-sm text-green-600">Booking conversation</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {chat.participant?.phone && (
            <button className="p-2 hover:bg-gray-200 rounded-lg">
              <Phone size={18} className="text-gray-600" />
            </button>
          )}
          <button className="p-2 hover:bg-gray-200 rounded-lg">
            <Info size={18} className="text-gray-600" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg md:hidden">
              <X size={18} className="text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.sender_id === user.id;
            const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
            const showTimestamp = index === 0 || 
              new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 5 * 60 * 1000; // 5 minutes

            return (
              <div key={message.id}>
                {showTimestamp && (
                  <div className="text-center my-4">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {formatMessageDate(message.created_at)}
                    </span>
                  </div>
                )}
                
                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                    {/* Avatar */}
                    {!isOwnMessage && showAvatar && (
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        {chat.participant?.avatar_url ? (
                          <img
                            src={chat.participant.avatar_url}
                            alt={message.sender?.first_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-white text-xs font-bold ${generateAvatarColor(chat.participant?.id)}`}>
                            {generateInitials(chat.participant?.first_name, chat.participant?.last_name)}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!isOwnMessage && !showAvatar && <div className="w-8"></div>}

                    {/* Message Content */}
                    <div className={`px-4 py-2 rounded-lg ${
                      isOwnMessage 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {message.message_type === 'image' ? (
                        <div>
                          <img
                            src={message.file_url}
                            alt="Shared image"
                            className="max-w-full h-auto rounded cursor-pointer"
                            onClick={() => window.open(message.file_url, '_blank')}
                          />
                          {message.content && (
                            <p className="mt-2 text-sm">{message.content}</p>
                          )}
                        </div>
                      ) : message.message_type === 'file' ? (
                        <div className="flex items-center gap-2">
                          <Paperclip size={16} />
                          <span className="flex-1 truncate">{message.file_name || message.content}</span>
                          <button
                            onClick={() => window.open(message.file_url, '_blank')}
                            className="p-1 hover:bg-opacity-20 hover:bg-white rounded"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                      
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {format(new Date(message.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(Array.from(e.target.files))}
            className="hidden"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <Paperclip size={20} />
          </button>

          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={sending || uploading}
            />
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || sending || uploading}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </form>
        
        {uploading && (
          <p className="text-sm text-gray-500 mt-2">Uploading file...</p>
        )}
      </div>
    </div>
  );
}
