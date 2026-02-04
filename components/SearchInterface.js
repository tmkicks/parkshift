import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Euro, Calendar, Car, Grid, Map as MapIcon, ArrowLeft, Filter } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function SearchInterface({ searchParams, onBackToSearch }) {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (searchParams) {
      searchParkingSpaces();
    }
  }, [searchParams]);

  useEffect(() => {
    if (viewMode === 'map' && parkingSpaces.length > 0 && mapRef.current && typeof window !== 'undefined') {
      initializeMap();
    }
  }, [viewMode, parkingSpaces]);

  const searchParkingSpaces = async () => {
    setLoading(true);
    try {
      // Simulate API call with search parameters
      const queryParams = new URLSearchParams({
        lat: searchParams.latitude,
        lng: searchParams.longitude,
        radius: searchParams.radius,
        timing: searchParams.timing,
        ...(searchParams.timing === 'hourly' ? {
          date: searchParams.date,
          startTime: searchParams.startTime,
          endTime: searchParams.endTime
        } : {
          startDate: searchParams.startDate,
          endDate: searchParams.endDate
        }),
        vehicleLength: searchParams.vehicle.length,
        vehicleWidth: searchParams.vehicle.width,
        vehicleHeight: searchParams.vehicle.height || 0,
        amenities: JSON.stringify(searchParams.amenities),
        preferences: JSON.stringify(searchParams.preferences)
      });

      const response = await fetch(`/api/search?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to search parking spaces');
      }

      const data = await response.json();
      
      // Mock data for demonstration if API doesn't return results
      const mockData = [
        {
          id: 1,
          title: "Secure Garage Downtown",
          address: "123 Main Street, Brussels 1000",
          latitude: searchParams.latitude + 0.001,
          longitude: searchParams.longitude + 0.001,
          hourly_price: 2.50,
          daily_price: 15.00,
          images: ["/api/placeholder/300/200"],
          amenities: { covered: true, security: true },
          distance: 0.3,
          rating: 4.8,
          reviews: 124
        },
        {
          id: 2,
          title: "City Center Parking",
          address: "456 Park Avenue, Brussels 1000",
          latitude: searchParams.latitude - 0.002,
          longitude: searchParams.longitude + 0.002,
          hourly_price: 1.80,
          daily_price: 12.00,
          images: ["/api/placeholder/300/200"],
          amenities: { evCharging: true },
          distance: 0.8,
          rating: 4.5,
          reviews: 89
        },
        {
          id: 3,
          title: "Underground Secure Parking",
          address: "789 Business District, Brussels 1000",
          latitude: searchParams.latitude + 0.003,
          longitude: searchParams.longitude - 0.001,
          hourly_price: 3.00,
          daily_price: 18.00,
          images: ["/api/placeholder/300/200"],
          amenities: { covered: true, security: true, accessibility: true },
          distance: 1.2,
          rating: 4.9,
          reviews: 156
        }
      ];

      setParkingSpaces(data.spaces || mockData);
    } catch (error) {
      console.error('Error searching parking spaces:', error);
      setParkingSpaces([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!window.mapboxgl || !searchParams.latitude || !searchParams.longitude) return;

    // Clear existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    window.mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const map = new window.mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [searchParams.longitude, searchParams.latitude],
      zoom: 13
    });

    // Add markers for parking spaces
    parkingSpaces.forEach(space => {
      const marker = new window.mapboxgl.Marker({ color: '#10B981' })
        .setLngLat([space.longitude, space.latitude])
        .setPopup(
          new window.mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">${space.title}</h3>
                <p class="text-sm text-gray-600">${space.address}</p>
                <p class="text-sm font-medium text-green-600">€${space.hourly_price}/hr • €${space.daily_price}/day</p>
              </div>
            `)
        )
        .addTo(map);

      marker.getElement().addEventListener('click', () => {
        setSelectedSpace(space);
      });
    });

    // Add search location marker
    new window.mapboxgl.Marker({ color: '#3B82F6' })
      .setLngLat([searchParams.longitude, searchParams.latitude])
      .setPopup(
        new window.mapboxgl.Popup({ offset: 25 })
          .setHTML('<div class="p-2"><strong>Your search location</strong></div>')
      )
      .addTo(map);

    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  };

  // Load Mapbox GL JS
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.mapboxgl) {
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => {
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      };
      document.head.appendChild(script);
    }
  }, []);

  const formatSearchSummary = () => {
    if (!searchParams) return '';
    
    const location = searchParams.location || 'Selected location';
    const timing = searchParams.timing === 'hourly' 
      ? `${searchParams.date} • ${searchParams.startTime} - ${searchParams.endTime}`
      : `${searchParams.startDate} to ${searchParams.endDate}`;
    
    return `${location} • ${timing}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Searching parking spaces..." size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToSearch}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {parkingSpaces.length} parking spaces found
                </h1>
                <p className="text-sm text-gray-600">{formatSearchSummary()}</p>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'map' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapIcon size={16} className="inline mr-1" />
                Map
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid size={16} className="inline mr-1" />
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'map' ? (
          /* Map View */
          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Map */}
            <div className="flex-1">
              <div 
                ref={mapRef} 
                className="w-full h-full rounded-lg overflow-hidden shadow-sm"
              />
            </div>

            {/* Selected Space Details */}
            {selectedSpace && (
              <div className="w-96 bg-white rounded-lg shadow-sm p-6 overflow-y-auto">
                <ParkingSpaceCard space={selectedSpace} detailed />
              </div>
            )}
          </div>
        ) : (
          /* List View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parkingSpaces.map(space => (
              <ParkingSpaceCard 
                key={space.id} 
                space={space} 
                onClick={() => setSelectedSpace(space)}
              />
            ))}
          </div>
        )}

        {parkingSpaces.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No parking spaces found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or expanding your search radius.
            </p>
            <button
              onClick={onBackToSearch}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Modify Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Parking Space Card Component
function ParkingSpaceCard({ space, detailed = false, onClick }) {
  const amenityIcons = {
    evCharging: '⚡',
    covered: '🏠',
    security: '🔒',
    accessibility: '♿'
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-48">
        <img
          src={space.images?.[0] || '/api/placeholder/300/200'}
          alt={space.title}
          className="w-full h-full object-cover rounded-t-lg"
        />
        <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded text-sm font-medium">
          {space.distance}km away
        </div>
        {space.rating && (
          <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
            ⭐ {space.rating} ({space.reviews})
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 mb-1">{space.title}</h3>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin size={14} />
            {space.address}
          </p>
        </div>

        {/* Amenities */}
        {space.amenities && Object.keys(space.amenities).length > 0 && (
          <div className="flex gap-2 mb-3">
            {Object.entries(space.amenities)
              .filter(([_, value]) => value)
              .map(([key, _]) => (
                <span key={key} className="text-lg" title={key}>
                  {amenityIcons[key] || '•'}
                </span>
              ))}
          </div>
        )}

        {/* Pricing */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-lg font-bold text-green-600">
              €{space.hourly_price}/hr
            </div>
            <div className="text-sm text-gray-500">
              €{space.daily_price}/day
            </div>
          </div>
          
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
            Book Now
          </button>
        </div>

        {detailed && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Distance:</strong> {space.distance}km from search location</p>
              <p><strong>Rating:</strong> ⭐ {space.rating}/5 ({space.reviews} reviews)</p>
              {space.amenities && (
                <p><strong>Features:</strong> {
                  Object.entries(space.amenities)
                    .filter(([_, value]) => value)
                    .map(([key, _]) => key)
                    .join(', ')
                }</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}