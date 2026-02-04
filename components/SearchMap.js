import { useState, useRef, useCallback, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import { Search, MapPin, Clock, Calendar, Filter, SlidersHorizontal } from 'lucide-react';
import LocationSearch from './LocationSearch';
import DateTimeSelector from './DateTimeSelector';
import SearchFilters from './SearchFilters';
import { spaceService } from '../lib/database';
import toast from 'react-hot-toast';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const BELGIUM_CENTER = { latitude: 50.8503, longitude: 4.3517 }; // Brussels

export default function SearchMap({ onSearch, onSpaceSelect }) {
  const [viewState, setViewState] = useState({
    latitude: BELGIUM_CENTER.latitude,
    longitude: BELGIUM_CENTER.longitude,
    zoom: 12
  });
  
  const [searchLocation, setSearchLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(1); // km
  const [selectedDates, setSelectedDates] = useState({
    startDate: new Date(),
    endDate: new Date(),
    startTime: '09:00',
    endTime: '17:00'
  });
  const [filters, setFilters] = useState({
    vehicleLength: null,
    vehicleWidth: null,
    vehicleHeight: null,
    evCharging: false,
    covered: false,
    security: false,
    accessibility: false,
    maxPrice: null
  });
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDateTime, setShowDateTime] = useState(false);
  
  const mapRef = useRef();

  // Search for parking spaces
  const handleSearch = useCallback(async () => {
    if (!searchLocation) {
      toast.error('Please select a search location');
      return;
    }

    setLoading(true);
    try {
      const searchParams = {
        latitude: searchLocation.latitude,
        longitude: searchLocation.longitude,
        radius: searchRadius,
        startDate: selectedDates.startDate,
        endDate: selectedDates.endDate,
        startTime: selectedDates.startTime,
        endTime: selectedDates.endTime,
        ...filters
      };

      const spaces = await spaceService.searchSpaces(searchParams);
      setParkingSpaces(spaces);
      onSearch && onSearch(spaces);

      // Fit map to show search area
      if (mapRef.current && spaces.length > 0) {
        const bounds = spaces.reduce((bounds, space) => {
          return bounds.extend([space.longitude, space.latitude]);
        }, new mapboxgl.LngLatBounds([searchLocation.longitude, searchLocation.latitude], [searchLocation.longitude, searchLocation.latitude]));
        
        mapRef.current.fitBounds(bounds, { padding: 50 });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search parking spaces');
    } finally {
      setLoading(false);
    }
  }, [searchLocation, searchRadius, selectedDates, filters, onSearch]);

  // Handle location selection
  const handleLocationSelect = useCallback((location) => {
    setSearchLocation(location);
    setViewState({
      ...viewState,
      latitude: location.latitude,
      longitude: location.longitude,
      zoom: 14
    });
  }, [viewState]);

  // Get current location
  const handleGetCurrentLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: 'Current Location'
          };
          handleLocationSelect(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Unable to get current location');
        }
      );
    } else {
      toast.error('Geolocation is not supported');
    }
  }, [handleLocationSelect]);

  // Calculate price display
  const calculatePrice = (space) => {
    const start = new Date(`${selectedDates.startDate.toDateString()} ${selectedDates.startTime}`);
    const end = new Date(`${selectedDates.endDate.toDateString()} ${selectedDates.endTime}`);
    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    
    if (hours >= 24) {
      const days = Math.ceil(hours / 24);
      return `€${(days * space.daily_price).toFixed(2)}`;
    } else {
      return `€${(hours * space.hourly_price).toFixed(2)}`;
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Search Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
          {/* Location Search */}
          <div className="flex gap-2">
            <div className="flex-1">
              <LocationSearch
                onLocationSelect={handleLocationSelect}
                placeholder="Where do you want to park?"
              />
            </div>
            <button
              onClick={handleGetCurrentLocation}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              title="Use current location"
            >
              <MapPin size={20} />
            </button>
          </div>

          {/* Quick Controls */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowDateTime(!showDateTime)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Calendar size={16} />
              Date & Time
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Filter size={16} />
              Filters
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Radius:</span>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={0.5}>0.5 km</option>
                <option value={1}>1 km</option>
                <option value={2}>2 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
              </select>
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchLocation || loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              <Search size={16} />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Date & Time Selector */}
        {showDateTime && (
          <div className="mt-2">
            <DateTimeSelector
              selectedDates={selectedDates}
              onDatesChange={setSelectedDates}
              onClose={() => setShowDateTime(false)}
            />
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-2">
            <SearchFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}
      </div>

      {/* Results Counter */}
      {parkingSpaces.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg px-3 py-2">
          <span className="text-sm font-medium text-gray-700">
            {parkingSpaces.length} space{parkingSpaces.length !== 1 ? 's' : ''} found
          </span>
        </div>
      )}

      {/* Map */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={false}
      >
        {/* Navigation Controls */}
        <NavigationControl position="bottom-right" />
        <GeolocateControl position="bottom-right" />

        {/* Search Location Marker */}
        {searchLocation && (
          <Marker
            latitude={searchLocation.latitude}
            longitude={searchLocation.longitude}
            color="#ef4444"
          >
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg" />
          </Marker>
        )}

        {/* Search Radius Circle */}
        {searchLocation && (
          <div>
            {/* This would need a custom implementation or use mapbox-gl draw plugin */}
          </div>
        )}

        {/* Parking Space Markers */}
        {parkingSpaces.map((space) => (
          <Marker
            key={space.id}
            latitude={space.latitude}
            longitude={space.longitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedSpace(space);
              onSpaceSelect && onSpaceSelect(space);
            }}
          >
            <div className="relative">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg hover:bg-green-700 cursor-pointer transform hover:scale-110 transition-transform">
                P
              </div>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-600 rotate-45" />
            </div>
          </Marker>
        ))}

        {/* Space Details Popup */}
        {selectedSpace && (
          <Popup
            latitude={selectedSpace.latitude}
            longitude={selectedSpace.longitude}
            onClose={() => setSelectedSpace(null)}
            closeButton={true}
            closeOnClick={false}
            offsetTop={-10}
            className="space-popup"
          >
            <div className="p-4 max-w-sm">
              <div className="space-y-3">
                {/* Space Image */}
                {selectedSpace.images && selectedSpace.images.length > 0 && (
                  <img
                    src={selectedSpace.images[0]}
                    alt={selectedSpace.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}

                {/* Space Info */}
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedSpace.title}</h3>
                  <p className="text-sm text-gray-600 truncate">{selectedSpace.address}</p>
                </div>

                {/* Price and Details */}
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {calculatePrice(selectedSpace)}
                    </div>
                    <div className="text-xs text-gray-500">
                      €{selectedSpace.hourly_price}/hour
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>{selectedSpace.length_cm}×{selectedSpace.width_cm}cm</div>
                    {selectedSpace.amenities?.covered && <div>Covered</div>}
                    {selectedSpace.amenities?.ev_charger && <div>EV Charger</div>}
                  </div>
                </div>

                {/* Reviews */}
                {selectedSpace.reviews && selectedSpace.reviews.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex text-yellow-400">
                      {'★'.repeat(Math.round(selectedSpace.reviews.reduce((sum, r) => sum + r.rating, 0) / selectedSpace.reviews.length))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({selectedSpace.reviews.length} review{selectedSpace.reviews.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}

                {/* Book Button */}
                <button
                  onClick={() => {
                    // Handle booking - this would open booking modal or navigate to booking page
                    console.log('Book space:', selectedSpace.id);
                  }}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium"
                >
                  Book Now
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="text-gray-700">Searching for parking spaces...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
