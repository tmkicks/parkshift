import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MessageCircle, Star, AlertTriangle } from 'lucide-react';
import Layout from '../../../components/Layout';
import ReviewForm from '../../../components/ReviewForm';
import DisputeForm from '../../../components/DisputeForm';
import { fetchBookingDetails } from '../../../lib/api';

export default function BookingConfirmation() {
  const router = useRouter();
  const { bookingId } = router.query;
  const [booking, setBooking] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  useEffect(() => {
    if (bookingId) {
      // Fetch booking details by ID
      fetchBookingDetails(bookingId).then(setBooking);
    }
  }, [bookingId]);

  if (!booking) return null;

  const canReview = () => {
    // Logic to determine if the user can leave a review
    return booking.status === 'completed' && !booking.user_review;
  };

  const canDispute = () => {
    // Logic to determine if the user can dispute the booking
    return booking.status === 'completed' && !booking.dispute;
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Booking Confirmation</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
          <div className="space-y-4">
            {/* Space Details */}
            <div className="border-b pb-4">
              <h3 className="font-medium text-gray-900">Parking Space</h3>
              <p className="text-sm text-gray-600">{booking.space?.name}</p>
              <p className="text-sm text-gray-600">
                {booking.space?.address}, {booking.space?.city}
              </p>
            </div>

            {/* User Details */}
            <div className="border-b pb-4">
              <h3 className="font-medium text-gray-900">Your Details</h3>
              <p className="text-sm text-gray-600">{booking.user?.name}</p>
              <p className="text-sm text-gray-600">{booking.user?.email}</p>
            </div>

            {/* Booking Dates */}
            <div className="border-b pb-4">
              <h3 className="font-medium text-gray-900">Booking Dates</h3>
              <p className="text-sm text-gray-600">
                {new Date(booking.start_time).toLocaleString()} -{' '}
                {new Date(booking.end_time).toLocaleString()}
              </p>
            </div>

            {/* Pricing */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-green-600">
                  €{booking.total_amount}
                </span>
              </div>
            </div>

            {/* Special Requests */}
            {booking.special_requests && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Special Requests
                </h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {booking.special_requests}
                </p>
              </div>
            )}

            {/* Access Instructions */}
            {booking.space?.access_instructions && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Access Instructions
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900 text-sm whitespace-pre-wrap">
                    {booking.space.access_instructions}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/messages')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <MessageCircle size={20} />
            Message Owner
          </button>

          {canReview() && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Star size={20} />
              Leave Review
            </button>
          )}

          {canDispute() && (
            <button
              onClick={() => setShowDisputeForm(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <AlertTriangle size={20} />
              Report Issue
            </button>
          )}
        </div>

        {/* Review Form Modal */}
        {showReviewForm && (
          <ReviewForm
            booking={booking}
            onClose={() => setShowReviewForm(false)}
            onSubmit={(review) => {
              // Refresh booking data or show success message
              setShowReviewForm(false);
            }}
          />
        )}

        {/* Dispute Form Modal */}
        {showDisputeForm && (
          <DisputeForm
            booking={booking}
            onClose={() => setShowDisputeForm(false)}
            onSubmit={(dispute) => {
              // Refresh booking data or show success message
              setShowDisputeForm(false);
            }}
          />
        )}
      </div>
    </Layout>
  );
}
