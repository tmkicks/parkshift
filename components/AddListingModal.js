import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient, createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { X, MapPin, Upload, Calendar, Euro, Check, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { listingService } from '../lib/database';

export default function AddListingModal({ onClose, onSave, onRefresh, userId, editingListing = null }) {
  const [step, setStep] = useState(1); // 1: Location, 2: Details, 3: Images, 4: Pricing, 5: Availability
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [listingData, setListingData] = useState({
    title: '',
    description: '',
    address: '',
    street_address: '',
    postal_code: '',
    city: '',
    additional_info: '',
    latitude: null,
    longitude: null,
    length_cm: 480,
    width_cm: 200,
    height_cm: 200,
    max_weight_kg: 3000,
    hourly_price: 1.50,
    daily_price: 8.00,
    amenities: {
      evCharging: false,
      covered: false,
      security: false,
      accessibility: false
    },
    images: [],
    access_instructions: '',
    minimum_duration_hours: 1,
    maximum_duration_hours: 168,
    is_active: true
  });
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    if (editingListing) {
      setListingData(editingListing);
      setStep(2); // Skip location step when editing - address shouldn't be changed
    }
  }, [editingListing]);

  // Initialize map when coordinates are available
  useEffect(() => {
    if (listingData.latitude && listingData.longitude && mapRef.current && typeof window !== 'undefined') {
      // Only initialize if mapbox is available
      if (window.mapboxgl) {
        // Clear existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        window.mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        
        const map = new window.mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [listingData.longitude, listingData.latitude],
          zoom: 15
        });

        // Add marker
        new window.mapboxgl.Marker({ color: '#10B981' })
          .setLngLat([listingData.longitude, listingData.latitude])
          .addTo(map);

        mapInstanceRef.current = map;
      }
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [listingData.latitude, listingData.longitude]);

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

  const steps = [
    { number: 1, title: 'Location', description: 'Where is your parking space?' },
    { number: 2, title: 'Details', description: 'Space specifications and amenities' },
    { number: 3, title: 'Images', description: 'Upload photos of your space' },
    { number: 4, title: 'Pricing', description: 'Set your rates' },
    { number: 5, title: 'Review', description: 'Confirm your listing' }
  ];

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
          const addressComponents = feature.place_name.split(', ');
          
          // Better parsing of address components
          let street_address = feature.text;
          let postal_code = '';
          let city = '';
          
          // Look for postal code (4 digits in Belgium)
          const postalMatch = feature.place_name.match(/\b(\d{4})\b/);
          if (postalMatch) {
            postal_code = postalMatch[1];
          }
          
          // Extract city - usually comes after postal code or is the last meaningful component
          if (feature.context) {
            // Find place (city) in context
            const placeContext = feature.context.find(ctx => ctx.id.startsWith('place.'));
            if (placeContext) {
              city = placeContext.text;
            }
          }
          
          // Fallback: parse from place_name
          if (!city) {
            const parts = feature.place_name.split(', ');
            // Find the part that comes after postal code or is a likely city name
            for (let i = 0; i < parts.length; i++) {
              const part = parts[i];
              if (part && !part.match(/^\d/) && part !== street_address && part !== 'Belgium' && part !== 'Belgique' && part !== 'België') {
                // Skip if it looks like a postal code
                if (!part.match(/^\d{4}$/)) {
                  city = part;
                  break;
                }
              }
            }
          }
          
          // Include house number if available
          if (feature.address) {
            street_address = `${feature.text} ${feature.address}`;
          }
          
          return {
            id: feature.id,
            place_name: feature.place_name,
            text: feature.text,
            longitude,
            latitude,
            street_address,
            postal_code,
            city,
            context: feature.context || []
          };
        });
        
        console.log('Parsed suggestions:', suggestions); // Debug log
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
    setListingData(prev => ({
      ...prev,
      address: suggestion.place_name,
      street_address: suggestion.street_address,
      postal_code: suggestion.postal_code,
      city: suggestion.city,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleImageUpload = async (files) => {
    if (files.length + listingData.images.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    setUploadingImages(true);
    const uploadedUrls = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum 5MB per image.`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setListingData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      // Clear validation errors when images are uploaded
      if (validationErrors.images) {
        setValidationErrors(prev => ({ ...prev, images: false }));
      }

      toast.success(`${uploadedUrls.length} images uploaded successfully`);
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setListingData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleNextStep = async () => {
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validation for each step
    if (step === 1) {
      if (!editingListing) {
        const errors = {};
        if (!listingData.street_address) errors.street_address = true;
        if (!listingData.postal_code) errors.postal_code = true;
        if (!listingData.city) errors.city = true;
        if (!listingData.latitude || !listingData.longitude) errors.location = true;
        
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          toast.error('Please search and select a valid address with all required fields');
          return;
        }
        // Construct full address for backend
        const fullAddress = `${listingData.street_address}, ${listingData.postal_code} ${listingData.city}${listingData.additional_info ? ', ' + listingData.additional_info : ''}`;
        setListingData(prev => ({ ...prev, address: fullAddress }));
      }
    } else if (step === 2) {
      const errors = {};
      if (!listingData.title.trim()) errors.title = true;
      if (!listingData.description.trim()) errors.description = true;
      if (!listingData.length_cm) errors.length_cm = true;
      if (!listingData.width_cm) errors.width_cm = true;
      if (!listingData.access_instructions.trim()) errors.access_instructions = true;
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error('Please fill in all required fields (Title, Description, Dimensions, and Access Instructions)');
        return;
      }
    } else if (step === 3) {
      if (listingData.images.length < 3) {
        setValidationErrors({ images: true });
        toast.error('Please upload at least 3 images of your parking space');
        return;
      }
    } else if (step === 4) {
      if (listingData.hourly_price <= 0 || listingData.daily_price <= 0) {
        toast.error('Please set valid pricing');
        return;
      }
    }

    setStep(step + 1);
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // Verify user authentication with detailed logging
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user || !user.id) {
        console.error('Authentication failed:', { authError, hasUser: !!user, hasUserId: !!user?.id });
        toast.error('You must be logged in to create a listing');
        setLoading(false);
        return;
      }

      // Validate required fields before submission
      if (!listingData.title || !listingData.address) {
        toast.error('Title and address are required');
        setLoading(false);
        return;
      }

      if (!listingData.latitude || !listingData.longitude) {
        toast.error('Location coordinates are required. Please select a location on the map.');
        setLoading(false);
        return;
      }

      // Use listingService for database operations
      let savedListing;
      
      if (editingListing) {
        console.log('=== MODAL: Updating existing listing ===');
        // Update existing listing - only editable fields
        savedListing = await listingService.updateListing(supabase, editingListing.id, user.id, {
          title: listingData.title,
          description: listingData.description,
          // Address is NOT updated when editing
          hourly_rate: parseFloat(listingData.hourly_price) || null,
          daily_rate: parseFloat(listingData.daily_price) || null,
          availability_type: "instant",
          length_cm: listingData.length_cm ? parseInt(listingData.length_cm) : null,
          width_cm: listingData.width_cm ? parseInt(listingData.width_cm) : null,
          height_cm: listingData.height_cm ? parseInt(listingData.height_cm) : null,
          amenities: listingData.amenities,
          images: listingData.images,
          access_instructions: listingData.access_instructions,
          minimum_duration_hours: listingData.minimum_duration_hours,
          maximum_duration_hours: listingData.maximum_duration_hours
        });
        toast.success('Listing updated successfully!');
      } else {
        console.log('=== MODAL: Creating new listing ===');
        // Create new listing - all fields including address
        savedListing = await listingService.createListing(supabase, user.id, {
          title: listingData.title,
          description: listingData.description,
          address: listingData.address,
          latitude: listingData.latitude,
          longitude: listingData.longitude,
          hourly_rate: parseFloat(listingData.hourly_price) || null,
          daily_rate: parseFloat(listingData.daily_price) || null,
          availability_type: "instant",
          length_cm: listingData.length_cm ? parseInt(listingData.length_cm) : null,
          width_cm: listingData.width_cm ? parseInt(listingData.width_cm) : null,
          height_cm: listingData.height_cm ? parseInt(listingData.height_cm) : null,
          amenities: listingData.amenities,
          images: listingData.images,
          access_instructions: listingData.access_instructions
        });
        toast.success('Listing created successfully!');
      }
      
      // Call all available callbacks to ensure refresh
      try {
        if (onSave) {
          const result = await Promise.resolve(onSave(savedListing));
        } else {
          console.log('=== MODAL: No onSave callback provided ===');
        }
        
        if (onRefresh) {
          const result = await Promise.resolve(onRefresh());
        } else {
          console.log('=== MODAL: No onRefresh callback provided ===');
        }
      } catch (callbackError) {
        console.error('=== MODAL: Error in callbacks ===');
        console.error('Callback error:', callbackError);
      }
      
      
      // Close modal after callbacks are processed
      onClose();
    } catch (error) {
      console.error('Error message:', error.message);
      toast.error(error.message || 'Failed to create listing');
    } finally {
      console.log('=== MODAL: handleSave function completed ===');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {editingListing ? 'Edit Listing' : 'Add New Parking Space'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {steps[step - 1].description}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={24} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            {steps.map((stepInfo, index) => (
              <div key={stepInfo.number} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepInfo.number
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}>
                  {step > stepInfo.number ? <Check size={16} /> : stepInfo.number}
                </div>
                <span className={`ml-2 text-sm ${
                  step >= stepInfo.number ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {stepInfo.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`ml-4 w-12 h-0.5 ${
                    step > stepInfo.number ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] min-h-[500px]">
          {/* Step 1: Location */}
          {step === 1 && !editingListing && (
            <div className="space-y-6 h-full flex flex-col">
              {/* Address Search Bar */}
              <div className="relative flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Address *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Start typing your address..."
                    onChange={(e) => handleLocationSearch(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  {searchingAddress && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={18} />
                  )}
                </div>
                
                {/* Address Suggestions */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-40 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg h-90 overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleAddressSelect(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      >
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {suggestion.text}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {suggestion.place_name}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Content Area - Always present to maintain modal size */}
              <div className="flex-1 h-[450px]">
                {/* Selected Address Details - Full height layout */}
                {listingData.latitude && listingData.longitude ? (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 h-full">
                    <h4 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-8">Selected Address</h4>
                    
                    <div className="grid grid-cols-5 gap-10 h-full">
                      {/* Address Fields - Left side (3/5 width) */}
                      <div className="col-span-3 space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                              Street Address
                            </label>
                            <input
                              type="text"
                              value={listingData.street_address}
                              onChange={(e) => setListingData(prev => ({ ...prev, street_address: e.target.value }))}
                              className={`w-full px-4 py-3.5 text-lg border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                                validationErrors.street_address 
                                  ? 'border-red-500 dark:border-red-400' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                              Postal Code
                            </label>
                            <input
                              type="text"
                              value={listingData.postal_code}
                              onChange={(e) => setListingData(prev => ({ ...prev, postal_code: e.target.value }))}
                              className={`w-full px-4 py-3.5 text-lg border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                                validationErrors.postal_code 
                                  ? 'border-red-500 dark:border-red-400' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                              City
                            </label>
                            <input
                              type="text"
                              value={listingData.city}
                              onChange={(e) => setListingData(prev => ({ ...prev, city: e.target.value }))}
                              className={`w-full px-4 py-3.5 text-lg border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                                validationErrors.city 
                                  ? 'border-red-500 dark:border-red-400' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                              Additional Information
                            </label>
                            <input
                              type="text"
                              value={listingData.additional_info}
                              onChange={(e) => setListingData(prev => ({ ...prev, additional_info: e.target.value }))}
                              placeholder="Building, apartment, etc."
                              className="w-full px-4 py-3.5 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Confirmation Map - Right side (2/5 width) */}
                      <div className="col-span-2 flex flex-col">
                        <div className="relative flex-1 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-300 dark:border-gray-600 shadow-lg">
                          <div 
                            ref={mapRef}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Empty state to maintain modal size - exact same height
                  <div className="h-full flex flex-col justify-end">
                    <div className="text-center text-gray-500 dark:text-gray-400 mb-16">
                      <MapPin className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                      <p className="text-xl font-medium">Search for an address above</p>
                      <p className="text-base mt-2">Select from the suggestions to continue</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}          {/* Step 1: Location (Edit Mode) */}
          {step === 1 && editingListing && (
            <div className="space-y-6">
              <div className="text-center">
                <img 
                  src="/logos/logo_dark.png" 
                  alt="ParkShift Logo" 
                  className="w-16 h-16 mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Where is your parking space?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Address cannot be changed when editing
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address (Cannot be changed)
                </label>
                <input
                  type="text"
                  value={listingData.address}
                  placeholder="Address cannot be changed when editing"
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed rounded-lg"
                  readOnly
                />
                <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                  ℹ️ The address cannot be changed when editing an existing listing.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="h-full flex flex-col">
              {/* Title and Description - Compact layout */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Space Title *
                  </label>
                  <input
                    type="text"
                    value={listingData.title}
                    onChange={(e) => setListingData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Secure garage space near city center"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                      validationErrors.title 
                        ? 'border-red-500 dark:border-red-400' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={listingData.description}
                    onChange={(e) => setListingData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    placeholder="Describe your parking space..."
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                      validationErrors.description 
                        ? 'border-red-500 dark:border-red-400' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
              </div>

              {/* Dimensions - Compact layout */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Space Dimensions *</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      value={listingData.length_cm || ''}
                      onChange={(e) => setListingData(prev => ({ ...prev, length_cm: parseInt(e.target.value) || null }))}
                      placeholder="480"
                      className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        validationErrors.length_cm 
                          ? 'border-red-500 dark:border-red-400' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      value={listingData.width_cm || ''}
                      onChange={(e) => setListingData(prev => ({ ...prev, width_cm: parseInt(e.target.value) || null }))}
                      placeholder="200"
                      className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        validationErrors.width_cm 
                          ? 'border-red-500 dark:border-red-400' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={listingData.height_cm || ''}
                      onChange={(e) => setListingData(prev => ({ ...prev, height_cm: parseInt(e.target.value) || null }))}
                      placeholder="200"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Typical car dimensions: 480cm × 200cm × 150cm
                </p>
              </div>

              {/* Amenities and Access Instructions - Side by side */}
              <div className="grid grid-cols-2 gap-8 flex-1">
                {/* Amenities - Left side */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Amenities</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries({
                      evCharging: 'EV Charging',
                      covered: 'Covered/Indoor',
                      security: 'Security/Guarded',
                      accessibility: 'Wheelchair Accessible'
                    }).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setListingData(prev => ({
                          ...prev,
                          amenities: { ...prev.amenities, [key]: !prev.amenities[key] }
                        }))}
                        className={`w-full px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                          listingData.amenities[key]
                            ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:border-green-400 dark:text-green-300'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {listingData.amenities[key] && <Check size={16} />}
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Access Instructions - Right side */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Access Instructions *
                  </label>
                  <textarea
                    value={listingData.access_instructions}
                    onChange={(e) => setListingData(prev => ({ ...prev, access_instructions: e.target.value }))}
                    rows={8}
                    placeholder="How should renters access the parking space? Include any codes, keys, or special instructions..."
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none ${
                      validationErrors.access_instructions 
                        ? 'border-red-500 dark:border-red-400' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Images */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Header content - only show when no images uploaded */}
              {listingData.images.length === 0 && (
                <div className="text-center">
                  <img 
                    src="/logos/logo_dark.png" 
                    alt="ParkShift Logo" 
                    className="w-16 h-16 mx-auto mb-4"
                  />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Add Photos
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload at least 3 high-quality photos of your parking space (up to 10 maximum)
                  </p>
                </div>
              )}

              {/* Upload Area */}
              <div className={`border-2 border-dashed rounded-lg p-8 ${
                validationErrors.images 
                  ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/10' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                  disabled={uploadingImages}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {uploadingImages ? (
                    <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
                  ) : (
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  )}
                  <span className="text-gray-600 dark:text-gray-400 text-center">
                    {uploadingImages ? 'Uploading images...' : 'Click to upload images'}
                    <br />
                    <span className="text-sm">
                      {listingData.images.length === 0 
                        ? 'Minimum 3 images required • Maximum 5MB per image'
                        : `${listingData.images.length}/10 uploaded • Maximum 5MB per image`
                      }
                    </span>
                  </span>
                </label>
              </div>

              {/* Image Preview */}
              {listingData.images.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Uploaded Images ({listingData.images.length}/10)
                    {listingData.images.length < 3 && (
                      <span className="text-red-500 text-sm ml-2">• Need {3 - listingData.images.length} more</span>
                    )}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {listingData.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Space image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Pricing */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <img 
                  src="/logos/logo_dark.png" 
                  alt="ParkShift Logo" 
                  className="w-16 h-16 mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Set Your Rates
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Recommended rates: €1.50/hour, €8.00/day
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hourly Rate (€)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0.50"
                    value={listingData.hourly_price}
                    onChange={(e) => setListingData(prev => ({ ...prev, hourly_price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Daily Rate (€)
                  </label>
                  <input
                    type="number"
                    step="1.00"
                    min="1.00"
                    value={listingData.daily_price}
                    onChange={(e) => setListingData(prev => ({ ...prev, daily_price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Duration (hours)
                  </label>
                  <select
                    value={listingData.minimum_duration_hours}
                    onChange={(e) => setListingData(prev => ({ ...prev, minimum_duration_hours: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                    <option value="4">4 hours</option>
                    <option value="24">1 day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Duration (hours)
                  </label>
                  <select
                    value={listingData.maximum_duration_hours}
                    onChange={(e) => setListingData(prev => ({ ...prev, maximum_duration_hours: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="24">1 day</option>
                    <option value="72">3 days</option>
                    <option value="168">1 week</option>
                    <option value="720">1 month</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <img 
                  src="/logos/logo_dark.png" 
                  alt="ParkShift Logo" 
                  className="w-16 h-16 mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Review Your Listing
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please review all information before publishing
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{listingData.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{listingData.address}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Dimensions:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {listingData.length_cm}cm × {listingData.width_cm}cm
                      {listingData.height_cm && ` × ${listingData.height_cm}cm`}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Pricing:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      €{listingData.hourly_price}/hr, €{listingData.daily_price}/day
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Images:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{listingData.images.length} uploaded</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Amenities:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {Object.values(listingData.amenities).filter(Boolean).length} selected
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            disabled={loading || (editingListing && step === 2)} // Can't go back to step 1 when editing
          >
            {step === 1 ? 'Cancel' : editingListing && step === 2 ? 'Cancel' : 'Back'}
          </button>
          
          <button
            onClick={step === 5 ? handleSave : handleNextStep}
            disabled={loading || uploadingImages}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {step === 5 ? (editingListing ? 'Update Listing' : 'Publish Listing') : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}