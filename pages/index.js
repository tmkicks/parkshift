import { useState, useEffect } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import Layout from '../components/Layout';
import SearchInterface from '../components/SearchInterface';
import EnhancedSearchModal from '../components/EnhancedSearchModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Calendar, Clock, Car, Settings, Search, Loader2 } from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [showMap, setShowMap] = useState(false);
  
  // Address search state
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase.auth]);

  const handleLocationSearch = async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingAddress(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&` +
        `country=BE&limit=5&types=address,poi`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const suggestions = data.features.map(feature => {
          const [longitude, latitude] = feature.center;
          return {
            id: feature.id,
            place_name: feature.place_name,
            text: feature.text,
            longitude,
            latitude
          };
        });
        
        setAddressSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearchingAddress(false);
    }
  };

  const handleAddressSelect = (suggestion) => {
    const locationData = {
      location: suggestion.text,
      address: suggestion.place_name,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude
    };
    setSelectedLocation(locationData);
    setAddressQuery(suggestion.text);
    setShowSuggestions(false);
    setAddressSuggestions([]);
    // Open modal immediately
    setShowSearchModal(true);
  };

  const handleContinueSearch = () => {
    if (selectedLocation) {
      setShowSearchModal(true);
    }
  };

  const handleSearch = (searchParams) => {
    console.log('Search params:', searchParams);
    // Merge location data with search params
    const completeSearchParams = {
      ...searchParams,
      ...selectedLocation
    };
    setSearchResults(completeSearchParams);
    setShowMap(true);
    setShowSearchModal(false);
  };

  if (loading) {
    return <LoadingSpinner message="Loading..." size="large" className="min-h-screen" />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {!showMap ? (
          /* Hero Section - Show when no search results */
          <div className="relative">
            {/* Hero Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
              <div className="text-center">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                  Find Your Perfect
                  <span className="text-green-600 block">Parking Space</span>
                </h1>
                <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
                  Discover convenient, secure parking spaces in your area. 
                  Book instantly or find long-term solutions for your vehicle.
                </p>

                {/* Direct Address Search */}
                <div className="max-w-2xl mx-auto mb-8">
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Where do you need parking? Start typing..."
                        value={addressQuery}
                        onChange={(e) => {
                          setAddressQuery(e.target.value);
                          handleLocationSearch(e.target.value);
                        }}
                        className="w-full px-6 py-4 pl-12 pr-12 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-lg"
                      />
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      {searchingAddress && (
                        <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={20} />
                      )}
                    </div>
                    
                    {/* Address Suggestions */}
                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute z-40 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleAddressSelect(suggestion)}
                            className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                          >
                            <div className="flex items-start gap-3">
                              <MapPin size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-gray-900 text-lg">{suggestion.text}</div>
                                <div className="text-sm text-gray-500">{suggestion.place_name}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Continue Button */}
                  {selectedLocation && (
                    <div className="mt-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-green-800">
                          <MapPin size={16} />
                          <span className="font-medium">Selected: {selectedLocation.location}</span>
                        </div>
                        <div className="text-sm text-green-600 mt-1">{selectedLocation.address}</div>
                      </div>
                      <button
                        onClick={handleContinueSearch}
                        className="bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg flex items-center gap-3 mx-auto"
                      >
                        <Calendar size={24} />
                        Continue with Search Options
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Search Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
                  <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                    <MapPin className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Smart Location</h3>
                    <p className="text-sm text-gray-600">Instant address suggestions</p>
                  </div>
                  <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                    <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Flexible Timing</h3>
                    <p className="text-sm text-gray-600">Hourly or daily bookings</p>
                  </div>
                  <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                    <Car className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Vehicle Matching</h3>
                    <p className="text-sm text-gray-600">Saved vehicles or custom</p>
                  </div>
                  <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                    <Settings className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Smart Filters</h3>
                    <p className="text-sm text-gray-600">Advanced preferences</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-2">10,000+</div>
                    <div className="text-gray-600">Available Parking Spaces</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
                    <div className="text-gray-600">Cities Covered</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                    <div className="text-gray-600">Customer Support</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Why Choose ParkShift?
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  We make parking simple, secure, and affordable for everyone.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-8 bg-white rounded-lg shadow-sm">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Perfect Location
                  </h3>
                  <p className="text-gray-600">
                    Find parking spaces exactly where you need them, with instant address suggestions and smart matching.
                  </p>
                </div>

                <div className="text-center p-8 bg-white rounded-lg shadow-sm">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Secure & Safe
                  </h3>
                  <p className="text-gray-600">
                    All parking spaces are verified and many include security features like cameras, lighting, and gated access.
                  </p>
                </div>

                <div className="text-center p-8 bg-white rounded-lg shadow-sm">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Instant Booking
                  </h3>
                  <p className="text-gray-600">
                    Book your parking space instantly with our easy-to-use platform. No waiting, no hassle.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gray-900 text-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4">
                    Ready to Find Your Parking Space?
                  </h2>
                  <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    Join thousands of satisfied customers who trust ParkShift for their parking needs.
                  </p>
                  <div className="space-x-4">
                    <button 
                      onClick={() => document.querySelector('input[placeholder*="Where do you need parking"]')?.focus()}
                      className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Start Your Search
                    </button>
                    {!user && (
                      <button className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors">
                        Sign Up Free
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Search Results - Show map and results */
          <SearchInterface 
            searchParams={searchResults}
            onBackToSearch={() => {
              setShowMap(false);
              setSearchResults(null);
            }}
          />
        )}

        {/* Enhanced Search Modal */}
        {showSearchModal && selectedLocation && (
          <EnhancedSearchModal
            initialLocation={selectedLocation}
            onClose={() => setShowSearchModal(false)}
            onSearch={handleSearch}
          />
        )}
      </div>
    </Layout>
  );
}