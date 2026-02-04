import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import Layout from '../components/Layout';
import ProfileInfo from '../components/ProfileInfo';
import VehicleManager from '../components/VehicleManager';
import PaymentMethods from '../components/PaymentMethods';
import History from '../components/History';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/auth');
        return;
      }
      setUser(user);

      // Load or create profile
      try {
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const newProfile = {
            id: user.id,
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            phone: '',
            address: {},
            preferences: {}
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            toast.error('Failed to create profile');
            return;
          }

          profile = createdProfile;
        } else if (profileError) {
          throw profileError;
        }

        setProfile(profile);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      }
    };

    getUser();
  }, [router, supabase.auth]);

  if (!user) {
    return <LoadingSpinner message="Loading profile..." size="xlarge" className="min-h-screen" />;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 py-4">
              {['profile', 'vehicles', 'payments', 'history', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    if (tab === 'settings') {
                      router.push('/settings');
                    } else {
                      setActiveTab(tab);
                    }
                  }}
                  className={`capitalize font-medium ${
                    activeTab === tab
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && <ProfileInfo user={user} profile={profile} />}
            {activeTab === 'vehicles' && <VehicleManager userId={user.id} />}
            {activeTab === 'payments' && <PaymentMethods userId={user.id} />}
            {activeTab === 'history' && <History userId={user.id} />}
            {/* TODO: Add other tab components */}
          </div>
        </div>
      </div>
    </Layout>
  );
}
