import { useState, useEffect } from 'react';
import { X, Car, Zap, Shield, Accessibility, Roof, DollarSign } from 'lucide-react';
import { vehicleService } from '../lib/database';
import { carQueryService } from '../lib/carquery';
import { createClientComponentClient, createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

export default function SearchFilters({ filters, onFiltersChange, onClose }) {
  const [userVehicles, setUserVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [customDimensions, setCustomDimensions] = useState({
    length: '',
    width: '',
    height: ''
  });
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    loadUserVehicles();
  }, []);

  const loadUserVehicles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const vehicles = await vehicleService.getUserVehicles(user.id);
      setUserVehicles(vehicles);

      // Auto-select primary vehicle if exists
      const primaryVehicle = vehicles.find(v => v.is_primary);
      if (primaryVehicle && !selectedVehicle) {
        handleVehicleSelect(primaryVehicle);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    const updates = { ...filters };
    
    if (vehicle) {
      updates.vehicleLength = vehicle.length_cm;
      updates.vehicleWidth = vehicle.width_cm;
      updates.vehicleHeight = vehicle.height_cm;
      updates.vehicleWeight = vehicle.weight_kg;
      updates.isElectric = vehicle.is_electric;
    } else {
      updates.vehicleLength = null;
      updates.vehicleWidth = null;
      updates.vehicleHeight = null;
      updates.vehicleWeight = null;
      updates.isElectric = false;
    }
    
    onFiltersChange(updates);
  };

  const handleCustomDimensionChange = (dimension, value) => {
    const numValue = value === '' ? null : parseInt(value);
    setCustomDimensions({ ...customDimensions, [dimension]: value });
    
    const updates = { ...filters };
    if (dimension === 'length') updates.vehicleLength = numValue;
    if (dimension === 'width') updates.vehicleWidth = numValue;
    if (dimension === 'height') updates.vehicleHeight = numValue;
    
    onFiltersChange(updates);
  };

  const handleAmenityToggle = (amenity) => {
    const updates = { ...filters, [amenity]: !filters[amenity] };
    onFiltersChange(updates);
  };

  const handlePriceChange = (maxPrice) => {
    const updates = { ...filters, maxPrice: maxPrice === '' ? null : parseFloat(maxPrice) };
    onFiltersChange(updates);
  };

  const clearAllFilters = () => {
    setSelectedVehicle(null);
    setCustomDimensions({ length: '', width: '', height: '' });
    onFiltersChange({
      vehicleLength: null,
      vehicleWidth: null,
      vehicleHeight: null,
      vehicleWeight: null,
      isElectric: false,
      evCharging: false,
      covered: false,
      security: false,
      accessibility: false,
      maxPrice: null
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <div className="flex gap-2">
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear All
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Vehicle Selection */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Car size={16} />
          Vehicle
        </h4>
        
        {/* Saved Vehicles */}
        {userVehicles.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Select from your vehicles:</label>
            <div className="space-y-1">
              {userVehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => handleVehicleSelect(vehicle)}
                  className={`w-full text-left p-2 rounded-lg border text-sm ${
                    selectedVehicle?.id === vehicle.id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </div>
                  <div className="text-xs text-gray-500">
                    {vehicle.length_cm}×{vehicle.width_cm}×{vehicle.height_cm}cm
                    {vehicle.is_electric && ' • Electric'}
                  </div>
                </button>
              ))}
              <button
                onClick={() => handleVehicleSelect(null)}
                className={`w-full text-left p-2 rounded-lg border text-sm ${
                  !selectedVehicle
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Custom dimensions</div>
                <div className="text-xs text-gray-500">Enter manually</div>
              </button>
            </div>
          </div>
        )}

        {/* Custom Dimensions */}
        {!selectedVehicle && (
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Vehicle dimensions (cm):</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="number"
                  placeholder="Length"
                  value={customDimensions.length}
                  onChange={(e) => handleCustomDimensionChange('length', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">Length</div>
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Width"
                  value={customDimensions.width}
                  onChange={(e) => handleCustomDimensionChange('width', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">Width</div>
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Height"
                  value={customDimensions.height}
                  onChange={(e) => handleCustomDimensionChange('height', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">Height</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Amenities */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Amenities</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.evCharging || false}
              onChange={() => handleAmenityToggle('evCharging')}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <Zap className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">EV Charging</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.covered || false}
              onChange={() => handleAmenityToggle('covered')}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <Roof className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">Covered/Indoor</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.security || false}
              onChange={() => handleAmenityToggle('security')}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">Security/Guarded</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.accessibility || false}
              onChange={() => handleAmenityToggle('accessibility')}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <Accessibility className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">Wheelchair Accessible</span>
          </label>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <DollarSign size={16} />
          Max Price per Hour
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">€</span>
          <input
            type="number"
            step="0.50"
            min="0"
            placeholder="No limit"
            value={filters.maxPrice || ''}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 text-xs">
          {[2, 3, 5, 10].map((price) => (
            <button
              key={price}
              onClick={() => handlePriceChange(price.toString())}
              className="px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              €{price}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Summary */}
      {(filters.vehicleLength || filters.evCharging || filters.covered || filters.security || filters.accessibility || filters.maxPrice) && (
        <div className="border-t pt-3">
          <div className="text-sm text-gray-600">Active filters:</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {filters.vehicleLength && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                {filters.vehicleLength}×{filters.vehicleWidth}×{filters.vehicleHeight}cm
              </span>
            )}
            {filters.evCharging && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">EV Charging</span>
            )}
            {filters.covered && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Covered</span>
            )}
            {filters.security && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Security</span>
            )}
            {filters.accessibility && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Accessible</span>
            )}
            {filters.maxPrice && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                Max €{filters.maxPrice}/h
              </span>
            )}
          </div>
        </div>
      )}

      {/* Apply Button */}
      <button
        onClick={onClose}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium"
      >
        Apply Filters
      </button>
    </div>
  );
}
