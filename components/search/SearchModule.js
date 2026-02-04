import { useState, useEffect } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import ErrorBoundary from '../ErrorBoundary';
import LoadingSpinner from '../LoadingSpinner';
import dynamic from 'next/dynamic';
import { MapPin, Search, Filter } from 'lucide-react';
import { Search, Filter, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load map and heavy components
const SearchMap = dynamic(() => import('./SearchMap'), {
  loading: () => <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">Loading map...</div>,
  ssr: false
});

const SearchFilters = dynamic(() => import('./SearchFilters'), {
  loading: () => <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>,
  ssr: false
});

const SearchResults = dynamic(() => import('./SearchResults'), {
  loading: () => <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>)}</div>,
  ssr: false
});

export default function SearchModule({ userId }) {
  const [searchState, setSearchState] = useState({
    location: null,
    radius: 1, // km
    dates: {
      startDate: null,
      endDate: null,
      isHourly: false,
      startTime: '09:00',
      endTime: '17:00'
    },
    vehicle: null,
    filters: {
      priceMin: null,
      priceMax: null,
      evCharging: false,
      covered: false,
      security: false,
      accessibility: false
    }
  });

  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    loadUserVehicles();
  }, [userId]);

  const loadUserVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
      
      // Set primary vehicle as default
      const primaryVehicle = data?.find(v => v.is_primary);
      if (primaryVehicle) {
        setSearchState(prev => ({ ...prev, vehicle: primaryVehicle }));
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchState.location) {
      alert('Please select a location');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchState)
      });

      if (!response.ok) throw new Error('Search failed');
      
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Find Your Perfect Parking Space
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Search for available parking spaces in Belgium
        </p>
      </div>

      {/* Quick Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Where do you need parking?
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter address or location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <Filter size={16} />
              Filters
            </button>
            
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Search size={16} />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Filters Sidebar */}
        <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <ErrorBoundary fallback={<div className="p-4 text-center text-gray-500">Filters unavailable</div>}>
            <SearchFilters
              searchState={searchState}
              setSearchState={setSearchState}
              vehicles={vehicles}
            />
          </ErrorBoundary>
        </div>

        {/* Map and Results */}
        <div className="lg:col-span-2 space-y-8">
          {/* Map */}
          <ErrorBoundary fallback={<div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">Map unavailable</div>}>
            <SearchMap
              searchState={searchState}
              setSearchState={setSearchState}
              results={searchResults}
            />
          </ErrorBoundary>

          {/* Results */}
          <ErrorBoundary fallback={<div className="p-4 text-center text-gray-500">Results unavailable</div>}>
            <SearchResults
              results={searchResults}
              loading={loading}
              selectedVehicle={searchState.vehicle}
              selectedDates={searchState.dates}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
