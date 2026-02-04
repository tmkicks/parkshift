import { useState } from 'react';
import { MapPin, Star, Clock, Car, Zap, Shield, Umbrella, Accessibility, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDistance } from 'date-fns';
import BookingModal from './BookingModal';
import SpaceDetailModal from './SpaceDetailModal';

export default function SearchResults({ results, loading, selectedVehicle, selectedDates }) {
  const [sortBy, setSortBy] = useState('distance'); // distance, price, rating
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);

  const sortOptions = [
    { value: 'distance', label: 'Distance', icon: MapPin },
    { value: 'price', label: 'Price', icon: Clock },
    { value: 'rating', label: 'Rating', icon: Star }
  ];

  const amenityIcons = {
    evCharging: Zap,
    covered: Umbrella,
    security: Shield,
    accessibility: Accessibility
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const getSortedResults = () => {
    if (!results) return [];
    
    return [...results].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'distance':
          comparison = (a.distance || 0) - (b.distance || 0);
          break;
        case 'price':
          const priceA = selectedDates.isHourly ? a.hourly_price : a.daily_price;
          const priceB = selectedDates.isHourly ? b.hourly_price : b.daily_price;
          comparison = priceA - priceB;
          break;
        case 'rating':
          comparison = (b.average_rating || 0) - (a.average_rating || 0);
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const handleSpaceClick = (space) => {
    setSelectedSpace(space);
    setShowDetailModal(true);
  };

  const handleBookNow = (space) => {
    setSelectedSpace(space);
    setShowBookingModal(true);
  };

  const formatPrice = (space) => {
    if (selectedDates.isHourly) {
      return `€${space.hourly_price}/hour`;
    } else {
      return `€${space.daily_price}/day`;
    }
  };

  const getSpaceAmenities = (space) => {
    const amenities = [];
    if (space.amenities) {
      Object.entries(space.amenities).forEach(([key, value]) => {
        if (value && amenityIcons[key]) {
          amenities.push({
            key,
            icon: amenityIcons[key],
            label: key.charAt(0).toUpperCase() + key.slice(1)
          });
        }
      });
    }
    return amenities;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Searching...
          </h3>
        </div>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-24 h-20 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const sortedResults = getSortedResults();

  return (
    <div className="space-y-4">
      {/* Header with sorting */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {results.length} parking spaces found
        </h3>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              const isActive = sortBy === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSort(option.value)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon size={14} />
                  {option.label}
                  {isActive && (
                    sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results list */}
      {sortedResults.length === 0 ? (
        <div className="text-center py-12">
          <img 
            src="/logos/logo_dark.png" 
            alt="ParkShift Logo" 
            className="w-12 h-12 mx-auto mb-4 opacity-40"
          />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No parking spaces found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search criteria or expanding the search radius.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedResults.map((space) => {
            const amenities = getSpaceAmenities(space);
            
            return (
              <div
                key={space.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-colors cursor-pointer"
                onClick={() => handleSpaceClick(space)}
              >
                <div className="p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-24 h-20 flex-shrink-0">
                      {space.images && space.images.length > 0 ? (
                        <img
                          src={space.images[0]}
                          alt={space.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <img 
                            src="/logos/logo_dark.png" 
                            alt="ParkShift Logo" 
                            className="w-8 h-8 opacity-40"
                          />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {space.title}
                        </h4>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatPrice(space)}
                          </div>
                          {space.distance && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {space.distance.toFixed(1)}km away
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {space.address}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Rating */}
                          {space.average_rating && (
                            <div className="flex items-center gap-1">
                              <Star size={14} className="text-yellow-400 fill-current" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {space.average_rating.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({space.review_count || 0})
                              </span>
                            </div>
                          )}

                          {/* Amenities */}
                          {amenities.length > 0 && (
                            <div className="flex items-center gap-1">
                              {amenities.slice(0, 3).map((amenity) => {
                                const Icon = amenity.icon;
                                return (
                                  <Icon
                                    key={amenity.key}
                                    size={14}
                                    className="text-green-600 dark:text-green-400"
                                    title={amenity.label}
                                  />
                                );
                              })}
                              {amenities.length > 3 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  +{amenities.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookNow(space);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showDetailModal && selectedSpace && (
        <SpaceDetailModal
          space={selectedSpace}
          onClose={() => setShowDetailModal(false)}
          onBookNow={() => {
            setShowDetailModal(false);
            setShowBookingModal(true);
          }}
          selectedVehicle={selectedVehicle}
          selectedDates={selectedDates}
        />
      )}

      {showBookingModal && selectedSpace && (
        <BookingModal
          space={selectedSpace}
          selectedVehicle={selectedVehicle}
          selectedDates={selectedDates}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            // You could add a success callback here
          }}
        />
      )}
    </div>
  );
}
