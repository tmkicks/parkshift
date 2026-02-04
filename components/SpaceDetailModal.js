import { useState, useEffect } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { X, MapPin, Star, Clock, Car, Zap, Shield, Umbrella, Accessibility, Calendar, Euro, Phone, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function SpaceDetailModal({ space, onClose, onBookNow, selectedVehicle, selectedDates }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [owner, setOwner] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createPagesBrowserClient();

  const amenityIcons = {
    evCharging: { icon: Zap, label: 'EV Charging', color: 'text-blue-600' },
    covered: { icon: Umbrella, label: 'Covered', color: 'text-gray-600' },
    security: { icon: Shield, label: 'Security', color: 'text-green-600' },
    accessibility: { icon: Accessibility, label: 'Accessible', color: 'text-purple-600' }
  };

  useEffect(() => {
    loadSpaceDetails();
  }, [space.id]);

  const loadSpaceDetails = async () => {
    try {
      // Load owner details
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, phone')
        .eq('id', space.owner_id)
        .single();

      if (ownerData) {
        setOwner(ownerData);
      }

      // Load reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(first_name, last_name, avatar_url)
        `)
        .eq('space_id', space.id)
        .eq('is_space_review', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reviewsData) {
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error loading space details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = () => {
    if (selectedDates.isHourly) {
      return `€${space.hourly_price}/hour`;
    } else {
      return `€${space.daily_price}/day`;
    }
  };

  const calculateTotalPrice = () => {
    if (selectedDates.isHourly) {
      const startTime = selectedDates.startTime.split(':');
      const endTime = selectedDates.endTime.split(':');
      const startHour = parseInt(startTime[0]) + parseInt(startTime[1]) / 60;
      const endHour = parseInt(endTime[0]) + parseInt(endTime[1]) / 60;
      const hours = endHour - startHour;
      return hours * space.hourly_price;
    } else {
      const daysDiff = Math.ceil((selectedDates.endDate - selectedDates.startDate) / (1000 * 60 * 60 * 24));
      return daysDiff * space.daily_price;
    }
  };

  const isVehicleCompatible = () => {
    if (!selectedVehicle || !space.length_cm || !space.width_cm) return true;
    
    const vehicleFitsLength = !selectedVehicle.length_cm || selectedVehicle.length_cm <= space.length_cm;
    const vehicleFitsWidth = !selectedVehicle.width_cm || selectedVehicle.width_cm <= space.width_cm;
    const vehicleFitsHeight = !selectedVehicle.height_cm || !space.height_cm || selectedVehicle.height_cm <= space.height_cm;
    const vehicleFitsWeight = !selectedVehicle.weight_kg || !space.max_weight_kg || selectedVehicle.weight_kg <= space.max_weight_kg;
    
    return vehicleFitsLength && vehicleFitsWidth && vehicleFitsHeight && vehicleFitsWeight;
  };

  const getSpaceAmenities = () => {
    const amenities = [];
    if (space.amenities) {
      Object.entries(space.amenities).forEach(([key, value]) => {
        if (value && amenityIcons[key]) {
          amenities.push({
            key,
            ...amenityIcons[key]
          });
        }
      });
    }
    return amenities;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === (space.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? (space.images?.length || 1) - 1 : prev - 1
    );
  };

  const handleContactOwner = () => {
    // This would open a messaging interface
    window.location.href = `/messages?user=${space.owner_id}&space=${space.id}`;
  };

  const amenities = getSpaceAmenities();
  const totalPrice = calculateTotalPrice();
  const compatible = isVehicleCompatible();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {space.title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-120px)]">
          {/* Left side - Images and details */}
          <div className="lg:w-2/3 overflow-y-auto">
            {/* Image Gallery */}
            <div className="relative h-64 lg:h-80">
              {space.images && space.images.length > 0 ? (
                <>
                  <img
                    src={space.images[currentImageIndex]}
                    alt={`${space.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {space.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                      >
                        <ChevronRight size={20} />
                      </button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {space.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <img 
                    src="/logos/logo_dark.png" 
                    alt="ParkShift Logo" 
                    className="w-16 h-16 opacity-40"
                  />
                </div>
              )}
            </div>

            {/* Space Information */}
            <div className="p-6 space-y-6">
              {/* Location and Basic Info */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{space.address}</span>
                </div>
                {space.average_rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-400 fill-current" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {space.average_rating.toFixed(1)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        ({space.review_count || 0} reviews)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Dimensions and Specifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Space Specifications
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {space.length_cm && space.width_cm && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Dimensions:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">
                        {(space.length_cm / 100).toFixed(1)}m × {(space.width_cm / 100).toFixed(1)}m
                        {space.height_cm && ` × ${(space.height_cm / 100).toFixed(1)}m`}
                      </span>
                    </div>
                  )}
                  {space.max_weight_kg && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Max Weight:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">{space.max_weight_kg}kg</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Min Duration:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{space.minimum_duration_hours}h</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Max Duration:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{space.maximum_duration_hours}h</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Compatibility */}
              {selectedVehicle && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Vehicle Compatibility
                  </h3>
                  <div className={`p-4 rounded-lg border ${
                    compatible 
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Car size={16} className={compatible ? 'text-green-600' : 'text-red-600'} />
                      <span className={`font-medium ${compatible ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                      </span>
                    </div>
                    <p className={`text-sm ${compatible ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {compatible ? 'Your vehicle fits in this space' : 'Your vehicle may not fit in this space'}
                    </p>
                  </div>
                </div>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Amenities
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {amenities.map((amenity) => {
                      const Icon = amenity.icon;
                      return (
                        <div key={amenity.key} className="flex items-center gap-2">
                          <Icon size={16} className={amenity.color} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{amenity.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description and Access Instructions */}
              {space.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Description
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {space.description}
                  </p>
                </div>
              )}

              {space.access_instructions && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Access Instructions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {space.access_instructions}
                  </p>
                </div>
              )}

              {/* Owner Information */}
              {owner && !loading && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Space Owner
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {owner.avatar_url ? (
                        <img src={owner.avatar_url} alt={`${owner.first_name} ${owner.last_name}`} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-gray-600 dark:text-gray-300">
                          {owner.first_name?.[0]}{owner.last_name?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {owner.first_name} {owner.last_name}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        {owner.phone && (
                          <a href={`tel:${owner.phone}`} className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700">
                            <Phone size={14} />
                            Call
                          </a>
                        )}
                        <button
                          onClick={handleContactOwner}
                          className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                        >
                          <MessageCircle size={14} />
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Recent Reviews
                  </h3>
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {review.reviewer.first_name} {review.reviewer.last_name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(review.created_at), 'MMM yyyy')}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Booking card */}
          <div className="lg:w-1/3 border-l border-gray-200 dark:border-gray-700">
            <div className="p-6 space-y-6">
              {/* Pricing */}
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatPrice()}
                </div>
                {space.distance && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {space.distance.toFixed(1)}km from your search location
                  </p>
                )}
              </div>

              {/* Booking Summary */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Booking Summary</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Dates:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {selectedDates.isHourly ? (
                        `${format(selectedDates.startDate, 'MMM d')} ${selectedDates.startTime}-${selectedDates.endTime}`
                      ) : (
                        `${format(selectedDates.startDate, 'MMM d')} - ${format(selectedDates.endDate, 'MMM d')}`
                      )}
                    </span>
                  </div>
                  
                  {selectedVehicle && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Vehicle:</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {selectedVehicle.make} {selectedVehicle.model}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Total:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      €{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Book Now Button */}
              <button
                onClick={onBookNow}
                disabled={!compatible}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  compatible
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {compatible ? 'Book Now' : 'Vehicle Incompatible'}
              </button>

              {!compatible && selectedVehicle && (
                <p className="text-xs text-red-600 dark:text-red-400 text-center">
                  Your selected vehicle doesn't fit the space dimensions
                </p>
              )}

              {/* Contact Owner */}
              <button
                onClick={handleContactOwner}
                className="w-full py-3 px-4 border border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                Contact Owner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
