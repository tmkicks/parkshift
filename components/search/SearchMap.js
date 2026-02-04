import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

export default function SearchMap({ searchState, setSearchState, results = [] }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Default to Brussels, Belgium
  const [lng, lat] = [4.3517, 50.8503];

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      setMapError('Mapbox token not configured');
      return;
    }

    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      // Dynamically import Mapbox to prevent SSR issues
      const mapboxgl = (await import('mapbox-gl')).default;
      await import('mapbox-gl/dist/mapbox-gl.css');
      
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

      if (map.current) return; // Initialize map only once

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: 12
      });

      map.current.on('load', () => {
        setMapLoaded(true);
      });

      // Add click handler for location selection
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        setSearchState(prev => ({
          ...prev,
          location: { latitude: lat, longitude: lng }
        }));
      });

    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to load map');
    }
  };

  if (mapError) {
    return (
      <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{mapError}</p>
          <p className="text-sm text-gray-400 mt-2">Please check your configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Select Location
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click on the map to select your parking location
        </p>
      </div>
      
      <div className="relative">
        <div ref={mapContainer} className="h-96" />
        
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
