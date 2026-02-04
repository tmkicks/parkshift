import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Layout from '../../components/Layout';
import BookingForm from '../../components/BookingForm';
import SpaceDetails from '../../components/SpaceDetails';
import LoadingSpinner from '../../components/LoadingSpinner';
import { spaceService, vehicleService } from '../../lib/database';
import { ArrowLeft } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function BookingPage() {
  const router = useRouter();
  const { spaceId } = router.query;
  const [space, setSpace] = useState(null);
  const [userVehicles, setUserVehicles] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    if (spaceId) {
      loadData();
    }
  }, [spaceId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      setUser(user);

      // Load space details
      const spaceData = await spaceService.getSpaceById(spaceId);
      setSpace(spaceData);

      // Load user vehicles
      const vehicles = await vehicleService.getUserVehicles(user.id);
      setUserVehicles(vehicles);
    } catch (error) {
      console.error('Error loading booking data:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading booking details..." size="xlarge" className="min-h-screen" />
      </Layout>
    );
  }

  if (!space) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Space not found</h2>
            <p className="text-gray-600 mb-4">The parking space you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Back to Search
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to search
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Space Details */}
          <div>
            <SpaceDetails space={space} />
          </div>

          {/* Booking Form */}
          <div>
            <Elements stripe={stripePromise}>
              <BookingForm
                space={space}
                userVehicles={userVehicles}
                user={user}
                onBookingComplete={(booking) => {
                  router.push(`/booking/confirmation/${booking.id}`);
                }}
              />
            </Elements>
          </div>
        </div>
      </div>
    </Layout>
  );
}
