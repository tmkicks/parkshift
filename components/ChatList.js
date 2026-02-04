import { useState, useEffect } from 'react';
import { Search, MessageCircle, Clock } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

export default function ChatList({ conversations, activeChat, onSelectChat, loading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);

  useEffect(() => {
    if (!conversations) return;
    
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv =>
        conv.participant?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.participant?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [conversations, searchQuery]);

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'dd/MM');
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

  const truncateMessage = (message, maxLength = 60) => {
    if (!message) return '';
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  if (loading) {
    return (
      <div className="h-full border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="space-y-3 p-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full border-r border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            {conversations.length === 0 ? (
              <>
                <MessageCircle className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-600 text-sm">
                  Start a conversation by booking a parking space or responding to a booking request.
                </p>
              </>
            ) : (
              <>
                <Search className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                <p className="text-gray-600 text-sm">No conversations match your search.</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectChat(conversation)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  activeChat?.id === conversation.id ? 'bg-green-50 border-r-2 border-green-600' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      {conversation.participant?.avatar_url ? (
                        <img
                          src={conversation.participant.avatar_url}
                          alt={`${conversation.participant.first_name} ${conversation.participant.last_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-white text-sm font-bold ${generateAvatarColor(conversation.participant?.id)}`}>
                          {generateInitials(conversation.participant?.first_name, conversation.participant?.last_name)}
                        </div>
                      )}
                    </div>
                    
                    {/* Unread indicator */}
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-medium truncate ${
                        conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {conversation.participant?.first_name} {conversation.participant?.last_name}
                      </h3>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500 ml-2">
                        <Clock size={12} />
                        {formatMessageTime(conversation.lastMessage?.created_at)}
                      </div>
                    </div>

                    {/* Last message preview */}
                    <p className={`text-sm truncate ${
                      conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                    }`}>
                      {conversation.lastMessage?.message_type === 'image' ? (
                        <span className="flex items-center gap-1">
                          📷 Image
                        </span>
                      ) : conversation.lastMessage?.message_type === 'file' ? (
                        <span className="flex items-center gap-1">
                          📎 File
                        </span>
                      ) : (
                        truncateMessage(conversation.lastMessage?.content)
                      )}
                    </p>

                    {/* Booking context if available */}
                    {conversation.booking_id && (
                      <p className="text-xs text-green-600 mt-1">
                        💬 Booking conversation
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
