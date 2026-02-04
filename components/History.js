import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Car, ArrowRight, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { bookingService } from '../lib/database';

export default function History({ userId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    if (userId) {
      fetchBookingHistory();
    }
  }, [userId]);

  const fetchBookingHistory = async () => {
    try {
      const data = await bookingService.getUserBookings(supabase, userId, 'renter');
      setBookings(data);
    } catch (error) {
      console.error('Error fetching booking history:', error);
      setError('Failed to load booking history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
    return hours === 1 ? '1 hour' : `${hours} hours`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchBookingHistory}
          className="mt-2 text-green-600 hover:text-green-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <CreditCard size={40} className="text-gray-400 dark:text-gray-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No bookings yet
        </h3>
        
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
          You haven't made any parking reservations yet. Start exploring available parking spaces in your area.
        </p>
        
        <Link 
          href="/"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Book your first parking here
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Booking History</h2>
      
      {bookings.map((booking) => (
        <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 mb-1">
                {booking.space?.title}
              </h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin size={16} className="mr-1" />
                <span className="text-sm">{booking.space?.address}</span>
              </div>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar size={16} className="mr-2 text-gray-400" />
              <div>
                <div className="font-medium">Start</div>
                <div>{formatDate(booking.start_datetime)}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock size={16} className="mr-2 text-gray-400" />
              <div>
                <div className="font-medium">Duration</div>
                <div>{calculateDuration(booking.start_datetime, booking.end_datetime)}</div>
              </div>
            </div>
            
            {booking.vehicle && (
              <div className="flex items-center">
                <Car size={16} className="mr-2 text-gray-400" />
                <div>
                  <div className="font-medium">Vehicle</div>
                  <div>{booking.vehicle.make} {booking.vehicle.model}</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900">
              €{booking.total_amount}
            </div>
            
            <div className="text-sm text-gray-500">
              Booked on {new Date(booking.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}