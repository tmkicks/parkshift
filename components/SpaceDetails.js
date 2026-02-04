import { useState } from 'react';
import { MapPin, Ruler, Car, Zap, Shield, Roof, Accessibility, Star, Phone, MessageCircle } from 'lucide-react';

export default function SpaceDetails({ space }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const amenityIcons = {
    ev_charger: { icon: Zap, label: 'EV Charging', color: 'text-blue-600' },
    covered: { icon: Roof, label: 'Covered', color: 'text-gray-600' },
    security: { icon: Shield, label: 'Security', color: 'text-green-600' },
    accessibility: { icon: Accessibility, label: 'Accessible', color: 'text-purple-600' }
  };

  const averageRating = space.reviews?.length > 0 
    ? space.reviews.reduce((sum, review) => sum + review.rating, 0) / space.reviews.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Image Gallery */}
      <div className="relative">
        {space.images && space.images.length > 0 ? (
          <div>
            <img
              src={space.images[currentImageIndex]}
              alt={space.title}
              className="w-full h-64 object-cover rounded-lg"
            />
            
            {space.images.length > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                {space.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-16 h-12 rounded border-2 ${
                      currentImageIndex === index 
                        ? 'border-green-500' 
                        : 'border-gray-300'
                    }`}
                  >
                    <img
                      src={space.images[index]}
                      alt={`${space.title} ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            )}
            
            {space.images.length > 1 && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {currentImageIndex + 1} / {space.images.length}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
            <Car className="w-16 h-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* Space Info */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{space.title}</h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <MapPin size={16} />
            {space.address}
          </div>
          
          {averageRating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{averageRating.toFixed(1)}</span>
              <span>({space.reviews.length} review{space.reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>

        {space.description && (
          <p className="text-gray-700 mb-4">{space.description}</p>
        )}
      </div>

      {/* Pricing */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold text-green-700">
              €{space.hourly_price}/hour
            </div>
            <div className="text-sm text-green-600">
              €{space.daily_price}/day
            </div>
          </div>
          <div className="text-right text-sm text-green-600">
            <div>Save with daily rates</div>
            <div>24+ hours automatically discounted</div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Ruler size={20} />
          Space Specifications
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Length:</span>
              <span className="ml-2 font-medium">{space.length_cm} cm</span>
            </div>
            <div>
              <span className="text-gray-600">Width:</span>
              <span className="ml-2 font-medium">{space.width_cm} cm</span>
            </div>
            {space.height_cm && (
              <div>
                <span className="text-gray-600">Height:</span>
                <span className="ml-2 font-medium">{space.height_cm} cm</span>
              </div>
            )}
            {space.max_weight_kg && (
              <div>
                <span className="text-gray-600">Max Weight:</span>
                <span className="ml-2 font-medium">{space.max_weight_kg} kg</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Amenities */}
      {space.amenities && Object.keys(space.amenities).some(key => space.amenities[key]) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
          
          <div className="flex flex-wrap gap-3">
            {Object.entries(space.amenities)
              .filter(([key, value]) => value && amenityIcons[key])
              .map(([key, value]) => {
                const { icon: Icon, label, color } = amenityIcons[key];
                return (
                  <div key={key} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                    <Icon size={16} className={color} />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Access Instructions */}
      {space.access_instructions && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Access Instructions</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm whitespace-pre-wrap">
              {space.access_instructions}
            </p>
          </div>
        </div>
      )}

      {/* Owner Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Space Owner</h3>
        
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
            {space.owner.first_name?.[0]}{space.owner.last_name?.[0]}
          </div>
          
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {space.owner.first_name} {space.owner.last_name}
            </div>
            <div className="text-sm text-gray-600">Space owner</div>
          </div>
          
          <div className="flex gap-2">
            {space.owner.phone && (
              <button className="p-2 bg-white rounded-lg border border-gray-300 hover:border-gray-400">
                <Phone size={16} className="text-gray-600" />
              </button>
            )}
            <button className="p-2 bg-white rounded-lg border border-gray-300 hover:border-gray-400">
              <MessageCircle size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      {space.reviews && space.reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Reviews</h3>
          
          <div className="space-y-4">
            {space.reviews.slice(0, 3).map((review, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                  <span className="text-sm text-gray-600">
                    by {review.reviewer.first_name}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-700">{review.comment}</p>
                )}
              </div>
            ))}
            
            {space.reviews.length > 3 && (
              <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                View all {space.reviews.length} reviews
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
