import { useState } from 'react';
import { createClientComponentClient, createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { Star, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewService } from '../lib/database';

export default function ReviewForm({ 
  booking, 
  onClose, 
  onSuccess,
  reviewType = 'space' // 'space' or 'user'
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createPagesBrowserClient();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const reviewData = {
        booking_id: booking.id,
        reviewer_id: booking.renter_id,
        reviewee_id: reviewType === 'space' ? booking.space.owner_id : booking.renter_id,
        space_id: reviewType === 'space' ? booking.space_id : null,
        rating,
        comment: comment.trim(),
        is_space_review: reviewType === 'space'
      };

      const review = await reviewService.createReview(supabase, reviewData);
      toast.success('Review submitted successfully');
      onSuccess(review);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getReviewTitle = () => {
    if (reviewType === 'space') {
      return `Review "${booking.space.title}"`;
    } else {
      return `Review ${booking.renter.first_name} ${booking.renter.last_name}`;
    }
  };

  const getReviewPrompt = () => {
    if (reviewType === 'space') {
      return 'How was your parking experience?';
    } else {
      return 'How was your experience with this renter?';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {getReviewTitle()}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {getReviewPrompt()}
            </p>

            {/* Star Rating */}
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }
                  />
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {rating === 0 ? 'Click to rate' :
               rating === 1 ? 'Poor' :
               rating === 2 ? 'Fair' :
               rating === 3 ? 'Good' :
               rating === 4 ? 'Very Good' :
               'Excellent'}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder={
                reviewType === 'space' 
                  ? 'Share details about the parking space, location, accessibility, or any other helpful information...'
                  : 'Share details about your experience with this person...'
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Booking Details
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p><strong>Space:</strong> {booking.space.title}</p>
              <p><strong>Dates:</strong> {new Date(booking.start_datetime).toLocaleDateString()} - {new Date(booking.end_datetime).toLocaleDateString()}</p>
              <p><strong>Total:</strong> €{booking.total_amount}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0 || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send size={16} />
              )}
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
