import { useState } from 'react';
import { Edit2, Trash2, Eye, EyeOff, MapPin, Euro, Calendar, Car, Star } from 'lucide-react';
import SchedulingModal from './SchedulingModal';

export default function ListingCard({ listing, onEdit, onDelete, onToggleStatus, onUpdate }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);

  const getRating = () => {
    if (!listing.reviews || listing.reviews.length === 0) return 0;
    return listing.reviews.reduce((sum, review) => sum + review.rating, 0) / listing.reviews.length;
  };

  const getBookingStats = () => {
    if (!listing.bookings) return { total: 0, upcoming: 0 };
    
    const now = new Date();
    const upcoming = listing.bookings.filter(booking => 
      new Date(booking.start_datetime) > now && booking.status !== 'cancelled'
    ).length;
    
    return {
      total: listing.bookings.length,
      upcoming
    };
  };

  const handleSchedulingSave = (availability) => {
    // Update the listing with new availability
    onUpdate?.({ ...listing, availability });
  };

  const stats = getBookingStats();
  const rating = getRating();

  return (
    <>
      <div className={`bg-white rounded-lg border-2 transition-all ${
        listing.is_active 
          ? 'border-gray-200 hover:border-green-300' 
          : 'border-red-300 bg-gray-50 hover:border-red-400'
      } flex overflow-hidden`}>
        {/* Image Section - Left Side - extends to card edges */}
        <div className="relative w-80 flex-shrink-0 overflow-hidden">
          <div className="h-52 bg-gray-200">
            {listing.images && listing.images.length > 0 ? (
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-full flex"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              listing.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {listing.is_active ? 'Active' : 'Paused'}
            </span>
          </div>

          {/* Image count badge */}
          {listing.images && listing.images.length > 1 && (
            <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-medium">
              {listing.images.length} photos
            </div>
          )}
        </div>

        {/* Content Section - Right Side */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start h-full">
            {/* Left Content */}
            <div className="flex-1 pr-6">
              <div className="mb-3">
                <h3 className={`font-semibold text-xl mb-1 uppercase ${
                  listing.is_active ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {listing.title}
                </h3>
                
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                  <MapPin size={14} />
                  <span>{listing.address}</span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <span>{listing.length_cm}×{listing.width_cm}cm</span>
                  {listing.height_cm && <span> × {listing.height_cm}cm height</span>}
                </div>
              </div>

              {/* Description */}
              {listing.description && (
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                  {listing.description}
                </p>
              )}
            </div>

            {/* Right Content - Pricing & Stats */}
            <div className="flex flex-col items-end">
              {/* Pricing */}
              <div className="text-right mb-4">
                <div className="text-2xl font-bold text-green-600">
                  €{listing.hourly_price}/hr
                </div>
                <div className="text-sm text-gray-500">
                  €{listing.daily_price}/day
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
                  <div className="text-xs text-gray-500">Bookings</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{stats.upcoming}</div>
                  <div className="text-xs text-gray-500">Upcoming</div>
                </div>
                
                <div className="text-center">
                  {rating > 0 ? (
                    <>
                      <div className="flex items-center justify-center gap-1">
                        <Star size={14} className="text-yellow-400 fill-current" />
                        <span className="text-lg font-semibold text-gray-900">{rating.toFixed(1)}</span>
                      </div>
                      <div className="text-xs text-gray-500">Rating</div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-semibold text-gray-400">-</div>
                      <div className="text-xs text-gray-500">No reviews</div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(listing)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit listing"
                >
                  <Edit2 size={16} />
                </button>
                
                <button
                  onClick={() => onToggleStatus(listing.id, !listing.is_active)}
                  className={`p-2 rounded-lg transition-colors ${
                    listing.is_active 
                      ? 'text-gray-600 hover:text-orange-600 hover:bg-orange-50' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                  title={listing.is_active ? 'Pause listing' : 'Activate listing'}
                >
                  {listing.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                
                <button
                  onClick={() => onDelete(listing.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete listing"
                >
                  <Trash2 size={16} />
                </button>

                <button
                  onClick={() => setShowScheduling(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  title="Schedule"
                >
                  <Calendar size={16} />
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showScheduling && (
        <SchedulingModal
          listing={listing}
          onClose={() => setShowScheduling(false)}
          onSave={handleSchedulingSave}
        />
      )}
    </>
  );
}
