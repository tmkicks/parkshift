import { useState } from 'react';
import { useRouter } from 'next/router';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import AuthForm from '../components/AuthForm';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createPagesBrowserClient();

  const handleAuth = async (email, password, isSignUp, userData = {}) => {
    setLoading(true);
    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              first_name: userData.firstName,
              last_name: userData.lastName
            }
          }
        });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) throw result.error;
      
      if (result.data.user) {
        router.push('/');
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-bounce-slow"></div>
        <div className="absolute top-1/4 right-20 w-16 h-16 bg-white/50 rounded-full animate-float"></div>
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-white/30 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-12 h-12 bg-white rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-1/3 w-8 h-8 bg-white/40 rounded-full animate-ping"></div>
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/logos/logo_dark.png" 
              alt="ParkShift Logo" 
              className="h-16 w-16 mx-auto mb-4"
            />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Welcome to ParkShift
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Find parking spaces or share your own
            </p>
          </div>
          
          <AuthForm 
            onAuth={handleAuth}
            onGoogleAuth={handleGoogleAuth}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}