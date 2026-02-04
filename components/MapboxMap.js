import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapboxMap({ 
  center, 
  searchResults = [], 
  onLocationSelect, 
  searchQuery,
  className = '' 
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(4.3517); // Default to Brussels
  const [lat, setLat] = useState(50.8503);
  const [zoom, setZoom] = useState(10);
  const markers = useRef([]);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });
    map.current.addControl(geolocate, 'top-right');

    // Handle map clicks for location selection
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      if (onLocationSelect) {
        onLocationSelect({ longitude: lng, latitude: lat });
      }
    });

    // Update state on map move
    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, []);

  // Handle search query for geocoding
  useEffect(() => {
    if (searchQuery && searchQuery.length > 2) {
      geocodeSearch(searchQuery);
    }
  }, [searchQuery]);

  // Handle center changes
  useEffect(() => {
    if (center && map.current) {
      map.current.flyTo({
        center: [center.longitude, center.latitude],
        zoom: 14,
        duration: 1000
      });
    }
  }, [center]);

  // Handle search results markers
  useEffect(() => {
    if (map.current) {
      clearMarkers();
      addResultMarkers();
    }
  }, [searchResults]);

  const geocodeSearch = async (query) => {
    try {
      // Focus on Belgium for more relevant results
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${mapboxgl.accessToken}&` +
        `country=BE&` +
        `proximity=${lng},${lat}&` +
        `limit=5`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        
        if (onLocationSelect) {
          onLocationSelect({ 
            longitude, 
            latitude, 
            address: data.features[0].place_name 
          });
        }

        // Fly to the location
        map.current.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          duration: 1000
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const clearMarkers = () => {
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
  };

  const addResultMarkers = () => {
    searchResults.forEach((result, index) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'parking-marker';
      el.innerHTML = `
        <div class="w-8 h-8 bg-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-green-700 transition-colors">
          €${result.hourly_price}
        </div>
      `;

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-sm">${result.title}</h3>
          <p class="text-xs text-gray-600">${result.address}</p>
          <div class="flex justify-between items-center mt-2">
            <span class="text-green-600 font-bold">€${result.hourly_price}/h</span>
            <span class="text-xs text-gray-500">${result.distance?.toFixed(1)}km away</span>
          </div>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([result.longitude, result.latitude])
        .setPopup(popup)
        .addTo(map.current);

      // Add click handler for result selection
      el.addEventListener('click', () => {
        // You can emit an event here for result selection
        if (window.onParkingSpaceSelect) {
          window.onParkingSpaceSelect(result);
        }
      });

      markers.current.push(marker);
    });
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Map info overlay */}
      <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2 text-xs font-mono">
        <div className="text-gray-600 dark:text-gray-400">
          Lng: {lng} | Lat: {lat} | Zoom: {zoom}
        </div>
      </div>

      {/* Search results count */}
      {searchResults.length > 0 && (
        <div className="absolute bottom-2 left-2 bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {searchResults.length} parking spaces found
          </span>
        </div>
      )}
    </div>
  );
}
