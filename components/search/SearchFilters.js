import { Calendar, Car, MapPin, Euro } from 'lucide-react';

export default function SearchFilters({ searchState, setSearchState, vehicles = [] }) {
  const updateFilters = (key, value) => {
    setSearchState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value }
    }));
  };

  const updateDates = (key, value) => {
    setSearchState(prev => ({
      ...prev,
      dates: { ...prev.dates, [key]: value }
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Search Filters
        </h3>

        {/* Vehicle Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Car size={16} />
            Select Vehicle
          </label>
          <select
            value={searchState.vehicle?.id || ''}
            onChange={(e) => {
              const vehicle = vehicles.find(v => v.id === e.target.value);
              setSearchState(prev => ({ ...prev, vehicle }));
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Select a vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model} ({vehicle.license_plate})
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Calendar size={16} />
            Booking Period
          </label>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => updateDates('isHourly', false)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !searchState.dates.isHourly
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => updateDates('isHourly', true)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchState.dates.isHourly
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Hourly
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={searchState.dates.startDate || ''}
                  onChange={(e) => updateDates('startDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              {!searchState.dates.isHourly ? (
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={searchState.dates.endDate || ''}
                    onChange={(e) => updateDates('endDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Start
                    </label>
                    <input
                      type="time"
                      value={searchState.dates.startTime}
                      onChange={(e) => updateDates('startTime', e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      End
                    </label>
                    <input
                      type="time"
                      value={searchState.dates.endTime}
                      onChange={(e) => updateDates('endTime', e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Euro size={16} />
            Price Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                placeholder="Min €"
                value={searchState.filters.priceMin || ''}
                onChange={(e) => updateFilters('priceMin', parseFloat(e.target.value) || null)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Max €"
                value={searchState.filters.priceMax || ''}
                onChange={(e) => updateFilters('priceMax', parseFloat(e.target.value) || null)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Amenities
          </label>
          <div className="space-y-2">
            {[
              { key: 'evCharging', label: 'EV Charging' },
              { key: 'covered', label: 'Covered/Indoor' },
              { key: 'security', label: 'Security/Guarded' },
              { key: 'accessibility', label: 'Wheelchair Accessible' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchState.filters[key]}
                  onChange={(e) => updateFilters(key, e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Search Radius */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <MapPin size={16} />
            Search Radius: {searchState.radius}km
          </label>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={searchState.radius}
            onChange={(e) => setSearchState(prev => ({ ...prev, radius: parseFloat(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>0.5km</span>
            <span>10km</span>
          </div>
        </div>
      </div>
    </div>
  );
}
