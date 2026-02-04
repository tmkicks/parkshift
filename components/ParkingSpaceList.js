import { useState } from 'react';
import { useRouter } from 'next/router';
import { MapPin, Star, Car, Zap, Shield, Roof, Accessibility, ArrowUpDown, SlidersHorizontal } from 'lucide-react';

export default function ParkingSpaceList({ spaces, loading, filters, onFiltersChange }) {
  const [sortBy, setSortBy] = useState('distance'); // distance, price_low, price_high, rating
  const [showSortMenu, setShowSortMenu] = useState(false);
  const router = useRouter();

  const sortOptions = [
    { value: 'distance', label: 'Distance', icon: MapPin },
    { value: 'price_low', label: 'Price: Low to High', icon: ArrowUpDown },
    { value: 'price_high', label: 'Price: High to Low', icon: ArrowUpDown },
    { value: 'rating', label: 'Highest Rated', icon: Star }
  ];

  const sortSpaces = (spaces, sortType) => {
    return [...spaces].sort((a, b) => {
      switch (sortType) {
        case 'price_low':
          return a.hourly_price - b.hourly_price;
        case 'price_high':
          return b.hourly_price - a.hourly_price;
        case 'rating':
          const aRating = a.reviews?.length ? a.reviews.reduce((sum, r) => sum + r.rating, 0) / a.reviews.length : 0;
          const bRating = b.reviews?.length ? b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length : 0;
          return bRating - aRating;
        case 'distance':
        default:
          return 0; // Distance sorting would require user location
      }
    });
  };

  const calculateDuration = () => {
    if (!filters?.selectedDates) return { hours: 1, type: 'hourly' };
    
    const start = new Date(`${filters.selectedDates.startDate?.toDateString()} ${filters.selectedDates.startTime}`);
    const end = new Date(`${filters.selectedDates.endDate?.toDateString()} ${filters.selectedDates.endTime}`);
    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    
    return {
      hours,
      type: hours >= 24 ? 'daily' : 'hourly'
    };
  };

  const calculatePrice = (space) => {
    const duration = calculateDuration();
    
    if (duration.type === 'daily') {
      const days = Math.ceil(duration.hours / 24);
      return {
        amount: days * space.daily_price,
        display: `€${(days * space.daily_price).toFixed(2)}`,
        period: `${days} day${days !== 1 ? 's' : ''}`
      };
    } else {
      return {
        amount: duration.hours * space.hourly_price,
        display: `€${(duration.hours * space.hourly_price).toFixed(2)}`,
        period: `${duration.hours} hour${duration.hours !== 1 ? 's' : ''}`
      };
    }
  };

  const getAmenityIcon = (amenity) => {
    const icons = {
      ev_charger: { icon: Zap, color: 'text-blue-500', label: 'EV Charging' },
      covered: { icon: Roof, color: 'text-gray-600', label: 'Covered' },
      security: { icon: Shield, color: 'text-green-600', label: 'Security' },
      accessibility: { icon: Accessibility, color: 'text-purple-600', label: 'Accessible' }
    };
    return icons[amenity];
  };

  const getRating = (space) => {
    if (!space.reviews || space.reviews.length === 0) return 0;
    return space.reviews.reduce((sum, review) => sum + review.rating, 0) / space.reviews.length;
  };

  const handleSpaceClick = (spaceId) => {
    router.push(`/booking/${spaceId}`);
  };

  const sortedSpaces = sortSpaces(spaces, sortBy);

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-32 h-24 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with sort */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {spaces.length} space{spaces.length !== 1 ? 's' : ''} found
          </h2>
          
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400"
            >
              <SlidersHorizontal size={16} />
              Sort by
            </button>
            
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                        sortBy === option.value ? 'bg-green-50 text-green-700' : 'text-gray-700'
                      }`}
                    >
                      <Icon size={16} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spaces List */}
      <div className="flex-1 overflow-y-auto">
        {sortedSpaces.length === 0 ? (
          <div className="p-8 text-center">
            <Car className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No spaces found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or location.</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {sortedSpaces.map((space) => {
              const price = calculatePrice(space);
              const rating = getRating(space);
              
              return (
                <div
                  key={space.id}
                  onClick={() => handleSpaceClick(space.id)}
                  className="bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer p-4"
                >
                  <div className="flex gap-4">
                    {/* Space Image */}
                    <div className="w-32 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {space.images && space.images.length > 0 ? (
                        <img
                          src={space.images[0]}
                          alt={space.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Space Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{space.title}</h3>
                        <div className="text-right ml-4">
                          <div className="text-lg font-bold text-green-600">{price.display}</div>
                          <div className="text-xs text-gray-500">{price.period}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <MapPin size={14} />
                        <span className="truncate">{space.address}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span>{space.length_cm}×{space.width_cm}cm</span>
                        {rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-400 fill-current" />
                            <span>{rating.toFixed(1)}</span>
                            <span>({space.reviews.length})</span>
                          </div>
                        )}
                      </div>

                      {/* Amenities */}
                      {space.amenities && (
                        <div className="flex gap-2">
                          {Object.entries(space.amenities)
                            .filter(([key, value]) => value && getAmenityIcon(key))
                            .slice(0, 4)
                            .map(([amenity, value]) => {
                              const amenityData = getAmenityIcon(amenity);
                              const Icon = amenityData.icon;
                              return (
                                <div
                                  key={amenity}
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-xs"
                                  title={amenityData.label}
                                >
                                  <Icon size={12} className={amenityData.color} />
                                  <span className="text-gray-600">{amenityData.label}</span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
