import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import Layout from '../components/Layout';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import LoadingSpinner from '../components/LoadingSpinner';
import { messageService } from '../lib/database';
import { notificationUtils } from '../lib/notifications';

export default function MessagesPage() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadConversations();
      
      // Set up real-time subscription for new conversations
      const subscription = supabase
        .channel('conversations')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
          },
          () => {
            loadConversations();
          }
        )
        .subscribe();

      return () => subscription.unsubscribe();
    }
  }, [user]);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    setUser(user);
  };

  const loadConversations = async () => {
    try {
      const convs = await messageService.getConversations(user.id);
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <LoadingSpinner message="Loading messages..." size="xlarge" className="min-h-screen" />;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm h-[700px] flex overflow-hidden">
          {/* Chat List */}
          <div className="w-1/3 border-r border-gray-200">
            <ChatList
              conversations={conversations}
              activeChat={activeChat}
              onSelectChat={setActiveChat}
              loading={loading}
            />
          </div>
          
          {/* Chat Window */}
          <div className="flex-1">
            <ChatWindow 
              chat={activeChat} 
              user={user}
              onClose={() => setActiveChat(null)}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
