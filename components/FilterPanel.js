import { useState } from 'react';
import { Zap, Shield, Umbrella, Accessibility, Euro, RotateCcw } from 'lucide-react';

export default function FilterPanel({ filters, onFiltersChange }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const amenityOptions = [
    {
      key: 'evCharging',
      label: 'EV Charging',
      icon: Zap,
      description: 'Electric vehicle charging available'
    },
    {
      key: 'covered',
      label: 'Covered',
      icon: Umbrella,
      description: 'Indoor or covered parking'
    },
    {
      key: 'security',
      label: 'Security',
      icon: Shield,
      description: 'Guarded or monitored area'
    },
    {
      key: 'accessibility',
      label: 'Accessible',
      icon: Accessibility,
      description: 'Wheelchair accessible'
    }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      evCharging: false,
      covered: false,
      security: false,
      accessibility: false,
      priceMin: 0,
      priceMax: 20
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Filters
        </h3>
        <button
          onClick={resetFilters}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          <Euro size={16} className="inline mr-1" />
          Price Range (per hour)
        </label>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Min</label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={localFilters.priceMin}
                onChange={(e) => handleFilterChange('priceMin', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="0"
              />
            </div>
            <div className="text-gray-400 mt-6">-</div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max</label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={localFilters.priceMax}
                onChange={(e) => handleFilterChange('priceMax', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="20"
              />
            </div>
          </div>
          
          {/* Price range slider */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={localFilters.priceMax}
              onChange={(e) => handleFilterChange('priceMax', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>€0</span>
              <span>€{localFilters.priceMax}/h</span>
              <span>€50</span>
            </div>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Amenities
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {amenityOptions.map((option) => {
            const Icon = option.icon;
            return (
              <label
                key={option.key}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  localFilters[option.key]
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <input
                  type="checkbox"
                  checked={localFilters[option.key]}
                  onChange={(e) => handleFilterChange(option.key, e.target.checked)}
                  className="sr-only"
                />
                <Icon 
                  size={20} 
                  className={localFilters[option.key] ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} 
                />
                <div>
                  <div className={`font-medium ${
                    localFilters[option.key] 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Additional Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Additional Preferences
        </label>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={localFilters.instantBooking || false}
              onChange={(e) => handleFilterChange('instantBooking', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Instant booking available</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={localFilters.nearPublicTransport || false}
              onChange={(e) => handleFilterChange('nearPublicTransport', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Near public transport</span>
          </label>
        </div>
      </div>

      {/* Active filters summary */}
      {Object.values(localFilters).some(value => 
        typeof value === 'boolean' ? value : (typeof value === 'number' && value > 0)
      ) && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {Object.entries(localFilters).map(([key, value]) => {
              if ((typeof value === 'boolean' && value) || (typeof value === 'number' && value > 0 && key !== 'priceMin')) {
                const option = amenityOptions.find(opt => opt.key === key);
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-full"
                  >
                    {option ? option.label : key}
                    {key === 'priceMax' && ` ≤€${value}`}
                  </span>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
