import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';

// Lazy load heavy components to prevent blocking
const SearchModule = dynamic(() => import('../components/search/SearchModule'), {
  loading: () => <LoadingSpinner message="Loading search interface..." />,
  ssr: false
});

export default function SearchPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (!user) {
        router.push('/auth');
        return;
      }
      
      setUser(user);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    return <LoadingSpinner message="Redirecting to login..." />;
  }

  return (
    <Layout>
      <ErrorBoundary fallback={
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Search Temporarily Unavailable
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We're experiencing technical difficulties with the search feature.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      }>
        <SearchModule userId={user.id} />
      </ErrorBoundary>
    </Layout>
  );
}
