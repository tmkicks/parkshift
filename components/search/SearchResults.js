import { Car, MapPin, Star } from 'lucide-react';

export default function SearchResults({ results = [], loading, selectedVehicle, selectedDates }) {
  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Searching for parking spaces...
        </h3>
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

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No parking spaces found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Try adjusting your search criteria or expanding the search radius.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {results.length} parking spaces found
      </h3>
      
      {results.map((space) => (
        <div
          key={space.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-colors p-4"
        >
          <div className="flex gap-4">
            {/* Placeholder for image */}
            <div className="w-24 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <Car className="w-8 h-8 text-gray-400" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {space.title || 'Parking Space'}
                </h4>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    €{selectedDates?.isHourly ? '1.50/hour' : '8.00/day'}
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
                  {space.address || 'Address not available'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Rating placeholder */}
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      4.5
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      (12)
                    </span>
                  </div>
                </div>

                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
