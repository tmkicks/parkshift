import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { X, MapPin, Search, Calendar, Clock, Car, Settings, Check, ChevronDown, Loader2, ChevronLeft, ChevronRight, Zap, Home, Shield, Accessibility, Eye, Sun, Navigation, Users, BarChart3, Ban } from 'lucide-react';
import { CarBrandLogo } from './CarBrandLogos';

// License plate component with country-specific styling (copied from VehicleManager)
const LicensePlate = ({ plate, country = 'BE' }) => {
  const plateFormats = {
    'BE': { 
      bg: 'bg-white', 
      text: 'text-red-600', 
      border: 'border-red-600', 
      flag: '🇧🇪',
      flagBg: 'bg-blue-600'
    },
    'DE': { 
      bg: 'bg-white', 
      text: 'text-black', 
      border: 'border-black', 
      flag: '🇩🇪',
      flagBg: 'bg-black'
    },
    'NL': { 
      bg: 'bg-yellow-300', 
      text: 'text-black', 
      border: 'border-black', 
      flag: '🇳🇱',
      flagBg: 'bg-orange-500'
    },
    'FR': { 
      bg: 'bg-white', 
      text: 'text-black', 
      border: 'border-black', 
      flag: '🇫🇷',
      flagBg: 'bg-blue-600'
    },
    'UK': { 
      bg: 'bg-white', 
      text: 'text-black', 
      border: 'border-black', 
      flag: '🇬🇧',
      flagBg: 'bg-blue-600'
    }
  };

  const format = plateFormats[country] || plateFormats['BE'];
  
  return (
    <div className={`inline-flex items-center ${format.bg} border-2 ${format.border} rounded px-2 py-1 font-mono text-sm shadow-sm`}>
      <div className={`${format.flagBg} text-white px-1 py-0.5 rounded-sm text-xs mr-2 font-bold flex items-center`}>
        <span className="mr-1">{format.flag}</span>
      </div>
      <span className={`${format.text} font-bold tracking-wider`}>{plate}</span>
    </div>
  );
};

export default function EnhancedSearchModal({ initialLocation, onClose, onSearch }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [userVehicles, setUserVehicles] = useState([]);
  const [searchData, setSearchData] = useState({
    // Pre-populated location from homepage
    location: initialLocation?.location || '',
    address: initialLocation?.address || '',
    latitude: initialLocation?.latitude || null,
    longitude: initialLocation?.longitude || null,
    // New unified date/time structure
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    currentTimeSelection: 'start', // 'start' or 'end'
    vehicleOption: 'saved', // Default to saved (primary vehicle)
    selectedVehicleId: '', // Will be set when vehicles load
    vehicle: {
      length: 0,
      width: 0,
      height: 0
    },
    amenities: {
      evCharging: false,
      covered: false,
      security: false,
      accessibility: false
    },
    preferences: {
      instantBooking: false,
      securityCameras: false,
      wellLit: false,
      easyAccess: false,
      attendedParking: false,
      heightRestriction: false
    }
  });

  // Fetch user vehicles from your existing API
  useEffect(() => {
    const fetchUserVehicles = async () => {
      try {
        setLoadingVehicles(true);
        
        const response = await fetch('/api/vehicles', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch vehicles');
        }

        const vehicles = await response.json();
        
        // Transform the API response to match our component structure
        const formattedVehicles = vehicles.map(vehicle => ({
          id: vehicle.id,
          name: vehicle.name || `${vehicle.make} ${vehicle.model}`,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          license_plate: vehicle.license_plate,
          length: vehicle.length || 450,
          width: vehicle.width || 180,
          height: vehicle.height || 150,
          isPrimary: vehicle.is_primary || false
        }));

        setUserVehicles(formattedVehicles);

        // Set the primary vehicle as default, or first vehicle if no primary
        const primaryVehicle = formattedVehicles.find(v => v.isPrimary) || formattedVehicles[0];
        if (primaryVehicle) {
          setSearchData(prev => ({
            ...prev,
            selectedVehicleId: primaryVehicle.id,
            vehicle: {
              length: primaryVehicle.length,
              width: primaryVehicle.width,
              height: primaryVehicle.height
            }
          }));
        }

      } catch (error) {
        console.error('Error fetching user vehicles:', error);
        
        // Fallback to default vehicle if API fails or user has no vehicles
        const fallbackVehicles = [
          { 
            id: 'default', 
            name: 'Standard Car', 
            make: 'Generic',
            model: 'Car',
            year: 2020,
            color: 'Gray',
            license_plate: 'DEMO-123',
            length: 450, 
            width: 180, 
            height: 150, 
            isPrimary: true 
          }
        ];
        
        setUserVehicles(fallbackVehicles);
        setSearchData(prev => ({
          ...prev,
          selectedVehicleId: 'default',
          vehicle: { length: 450, width: 180, height: 150 }
        }));
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchUserVehicles();
  }, []);

  const steps = [
    { number: 1, title: 'Schedule', icon: Calendar, description: 'When do you need parking?' },
    { number: 2, title: 'Vehicle', icon: Car, description: 'What are you parking?' },
    { number: 3, title: 'Preferences', icon: Settings, description: 'Any specific requirements?' }
  ];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      onSearch(searchData);
      setLoading(false);
    }, 1000);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        // For step 1, we need a start date, start time, and end time
        // For same-day rentals, endDate equals startDate or can be empty
        return searchData.startDate && searchData.startTime && searchData.endTime;
      case 2:
        return searchData.vehicleOption === 'skip' || 
               (searchData.vehicleOption !== 'custom' ? true : 
                (searchData.vehicle.length && searchData.vehicle.width));
      default:
        return true;
    }
  };

  // Generate time slots (1-hour intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  };

  // Handle date selection
  const handleDateSelect = (dateStr) => {
    if (!searchData.startDate) {
      // First date selection - set as start date
      setSearchData(prev => ({ 
        ...prev, 
        startDate: dateStr, 
        endDate: '', 
        currentTimeSelection: 'start',
        startTime: '',
        endTime: ''
      }));
    } else if (!searchData.endDate && dateStr !== searchData.startDate) {
      // Second date selection - set as end date if different from start
      setSearchData(prev => ({ 
        ...prev, 
        endDate: dateStr,
        currentTimeSelection: 'end'
      }));
    } else if (dateStr === searchData.startDate && !searchData.endDate) {
      // Same date selected - single day rental
      setSearchData(prev => ({ 
        ...prev, 
        endDate: dateStr,
        currentTimeSelection: searchData.startTime ? 'end' : 'start'
      }));
    } else {
      // Reset selection
      setSearchData(prev => ({ 
        ...prev, 
        startDate: dateStr, 
        endDate: '', 
        currentTimeSelection: 'start',
        startTime: '',
        endTime: ''
      }));
    }
  };

  // Handle time selection
  const handleTimeSelect = (time) => {
    if (searchData.currentTimeSelection === 'start') {
      setSearchData(prev => ({ 
        ...prev, 
        startTime: time,
        currentTimeSelection: 'end'
      }));
    } else {
      setSearchData(prev => ({ 
        ...prev, 
        endTime: time
      }));
    }
  };

  // Check if a date is in the selected range
  const isDateInRange = (dateStr) => {
    if (!searchData.startDate || !searchData.endDate) return false;
    if (searchData.startDate === searchData.endDate) return false;
    return dateStr > searchData.startDate && dateStr < searchData.endDate;
  };

  // Check if a time is in the selected range
  const isTimeInRange = (time) => {
    if (!searchData.startTime || !searchData.endTime) return false;
    // For same day rentals (or when only one date is selected)
    if (!searchData.endDate || searchData.startDate === searchData.endDate) {
      // Check if current time is between start and end time
      return time > searchData.startTime && time < searchData.endTime;
    }
    // For multi-day rentals, don't show time ranges
    return false;
  };

    // Amenities with icons
  const amenitiesConfig = {
    evCharging: { label: 'EV Charging', icon: Zap },
    covered: { label: 'Covered/Indoor', icon: Home },
    security: { label: 'Security/Guarded', icon: Shield },
    accessibility: { label: 'Wheelchair Accessible', icon: Accessibility }
  };

  // Preferences with icons
  const preferencesConfig = {
    instantBooking: { label: 'Instant Booking', icon: Clock },
    securityCameras: { label: 'Security Cameras', icon: Eye },
    wellLit: { label: 'Well Lit Area', icon: Sun },
    easyAccess: { label: 'Easy Access', icon: Navigation },
    attendedParking: { label: 'Attended Parking', icon: Users },
    heightRestriction: { label: 'No Height Restrictions', icon: Ban }
  };

  // Generate calendar
  const generateCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;
      const dateStr = date.toISOString().split('T')[0];
      
      days.push({
        day,
        date: dateStr,
        isToday,
        isPast,
        isStartDate: searchData.startDate === dateStr,
        isEndDate: searchData.endDate === dateStr,
        isInRange: isDateInRange(dateStr)
      });
    }
    
    return { days, month, year };
  };

  // Get vehicle brand logo with better styling
  const getVehicleBrandLogo = (make) => {
    const brandLogos = {
      'toyota': { emoji: '🚗', color: 'text-red-500', bg: 'bg-red-50' },
      'honda': { emoji: '🚗', color: 'text-blue-500', bg: 'bg-blue-50' },
      'ford': { emoji: '🚗', color: 'text-blue-600', bg: 'bg-blue-50' }, 
      'chevrolet': { emoji: '🚗', color: 'text-yellow-500', bg: 'bg-yellow-50' },
      'nissan': { emoji: '🚗', color: 'text-gray-600', bg: 'bg-gray-50' },
      'bmw': { emoji: '🚗', color: 'text-blue-700', bg: 'bg-blue-50' },
      'mercedes': { emoji: '🚗', color: 'text-gray-700', bg: 'bg-gray-50' },
      'audi': { emoji: '🚗', color: 'text-red-600', bg: 'bg-red-50' },
      'volkswagen': { emoji: '🚗', color: 'text-blue-600', bg: 'bg-blue-50' },
      'hyundai': { emoji: '🚗', color: 'text-blue-500', bg: 'bg-blue-50' },
      'kia': { emoji: '🚗', color: 'text-red-500', bg: 'bg-red-50' },
      'mazda': { emoji: '🚗', color: 'text-red-500', bg: 'bg-red-50' },
      'subaru': { emoji: '🚗', color: 'text-blue-600', bg: 'bg-blue-50' },
      'lexus': { emoji: '🚗', color: 'text-gray-700', bg: 'bg-gray-50' },
      'acura': { emoji: '🚗', color: 'text-red-600', bg: 'bg-red-50' },
      'infiniti': { emoji: '🚗', color: 'text-gray-600', bg: 'bg-gray-50' },
      'cadillac': { emoji: '🚗', color: 'text-purple-600', bg: 'bg-purple-50' },
      'buick': { emoji: '🚗', color: 'text-blue-600', bg: 'bg-blue-50' },
      'gmc': { emoji: '�', color: 'text-red-600', bg: 'bg-red-50' },
      'jeep': { emoji: '🚙', color: 'text-green-600', bg: 'bg-green-50' },
      'ram': { emoji: '🚛', color: 'text-gray-700', bg: 'bg-gray-50' },
      'dodge': { emoji: '🚗', color: 'text-red-600', bg: 'bg-red-50' },
      'chrysler': { emoji: '🚗', color: 'text-blue-600', bg: 'bg-blue-50' },
      'tesla': { emoji: '⚡', color: 'text-red-500', bg: 'bg-red-50' },
      'porsche': { emoji: '🏎️', color: 'text-yellow-500', bg: 'bg-yellow-50' },
      'ferrari': { emoji: '🏎️', color: 'text-red-500', bg: 'bg-red-50' },
      'lamborghini': { emoji: '🏎️', color: 'text-yellow-500', bg: 'bg-yellow-50' },
      'maserati': { emoji: '🏎️', color: 'text-blue-600', bg: 'bg-blue-50' },
      'bentley': { emoji: '🚗', color: 'text-green-700', bg: 'bg-green-50' },
      'rolls-royce': { emoji: '🚗', color: 'text-purple-700', bg: 'bg-purple-50' },
      'generic': { emoji: '🚗', color: 'text-gray-500', bg: 'bg-gray-50' }
    };
    
    return brandLogos[make?.toLowerCase()] || brandLogos['generic'];
  };

  // Get color display with just the visual swatch (no text)
  const getColorSwatch = (color) => {
    const colorMap = {
      'black': 'bg-gray-900',
      'white': 'bg-white border-2 border-gray-300',
      'silver': 'bg-gray-400',
      'gray': 'bg-gray-500',
      'red': 'bg-red-600',
      'blue': 'bg-blue-600',
      'green': 'bg-green-600',
      'yellow': 'bg-yellow-500',
      'orange': 'bg-orange-500',
      'purple': 'bg-purple-600',
      'brown': 'bg-amber-700',
      'gold': 'bg-yellow-600',
      'maroon': 'bg-red-800',
      'navy': 'bg-blue-900'
    };
    
    return colorMap[color?.toLowerCase()] || 'bg-gray-300';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Complete Your Search</h2>
              <p className="text-gray-600 mt-1">
                <MapPin size={16} className="inline mr-1" />
                {searchData.location}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            {steps.map((stepInfo, index) => (
              <div key={stepInfo.number} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepInfo.number
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepInfo.number ? <Check size={16} /> : <stepInfo.icon size={16} />}
                </div>
                <span className={`ml-2 text-sm ${
                  step >= stepInfo.number ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {stepInfo.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`ml-4 w-12 h-0.5 ${
                    step > stepInfo.number ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] min-h-[500px]">
          
          {/* Step 1: Schedule */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">When do you need parking?</h3>
                <p className="text-gray-600">Select dates and times for your parking needs</p>
              </div>

              {/* Calendar + Time Selection Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left Side - Calendar */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Select Date(s)</h4>
                  <div className="border-2 border-gray-200 rounded-xl p-4">
                    {(() => {
                      const { days, month, year } = generateCalendar();
                      return (
                        <div>
                          <div className="text-center mb-4 font-semibold text-gray-700">
                            {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </div>
                          <div className="grid grid-cols-7 gap-1 text-center text-sm">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                              <div key={day} className="p-2 font-medium text-gray-500">{day}</div>
                            ))}
                            {days.map((day, index) => (
                              <button
                                key={index}
                                onClick={() => day && !day.isPast && handleDateSelect(day.date)}
                                disabled={!day || day.isPast}
                                className={`p-2 rounded-lg font-medium transition-all text-sm ${
                                  !day ? 'invisible' :
                                  day.isPast ? 'text-gray-300 cursor-not-allowed' :
                                  day.isStartDate ? 'bg-green-600 text-white' :
                                  day.isEndDate ? 'bg-green-600 text-white' :
                                  day.isInRange ? 'bg-green-100 text-green-800' :
                                  day.isToday ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                  'hover:bg-gray-100 text-gray-700'
                                }`}
                              >
                                {day?.day}
                              </button>
                            ))}
                          </div>
                          
                          {/* Date Selection Status */}
                          <div className="mt-4 text-xs text-gray-600">
                            {!searchData.startDate && "Click a date to start"}
                            {searchData.startDate && !searchData.endDate && "Click same date for hourly or another for multi-day"}
                            {searchData.startDate && searchData.endDate && searchData.startDate === searchData.endDate && "Same day rental selected"}
                            {searchData.startDate && searchData.endDate && searchData.startDate !== searchData.endDate && "Multi-day rental selected"}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right Side - Time Selection */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Select Time
                    {searchData.currentTimeSelection === 'start' && searchData.startDate && (
                      <span className="text-sm text-green-600 ml-2">
                        (Start time for {new Date(searchData.startDate).toLocaleDateString()})
                      </span>
                    )}
                    {searchData.currentTimeSelection === 'end' && searchData.endDate && (
                      <span className="text-sm text-red-600 ml-2">
                        (End time for {new Date(searchData.endDate).toLocaleDateString()})
                      </span>
                    )}
                  </h4>
                  
                  {searchData.startDate ? (
                    <div className="border-2 border-gray-200 rounded-xl p-4">
                      <div className="grid grid-cols-4 gap-1 max-h-64 overflow-y-auto">
                        {generateTimeSlots().map(time => (
                          <button
                            key={time}
                            onClick={() => handleTimeSelect(time)}
                            className={`px-2 py-1 text-xs rounded font-medium transition-all ${
                              searchData.startTime === time || searchData.endTime === time ? 
                                'bg-green-600 text-white' :
                              isTimeInRange(time) ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                      
                      {/* Time Selection Status */}
                      <div className="mt-3 text-xs text-gray-600">
                        {searchData.currentTimeSelection === 'start' && "Select start time"}
                        {searchData.currentTimeSelection === 'end' && "Select end time"}
                        {searchData.startTime && searchData.endTime && (
                          <div className="text-green-700 font-medium">
                            Selected: {searchData.startTime} - {searchData.endTime}
                            {searchData.startDate !== searchData.endDate && (
                              <span className="block">
                                From {new Date(searchData.startDate).toLocaleDateString()} to {new Date(searchData.endDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-gray-200 rounded-xl p-4 text-center text-gray-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Select a date first to choose times</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Selection Summary */}
              {searchData.startDate && searchData.startTime && searchData.endTime && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-800 mb-2">Parking Schedule Summary</h5>
                  <div className="text-sm text-green-700">
                    {searchData.startDate === searchData.endDate ? (
                      <p>
                        <strong>Same day rental:</strong> {new Date(searchData.startDate).toLocaleDateString()} 
                        from {searchData.startTime} to {searchData.endTime}
                      </p>
                    ) : (
                      <p>
                        <strong>Multi-day rental:</strong> From {new Date(searchData.startDate).toLocaleDateString()} at {searchData.startTime} to {new Date(searchData.endDate).toLocaleDateString()} at {searchData.endTime}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Vehicle */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Car className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Vehicle Information</h3>
                <p className="text-gray-600">Choose your vehicle or customize dimensions</p>
              </div>

              {/* Vehicle Selection Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left Side - Vehicle Dropdown */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Select Vehicle</h4>
                  <div className="space-y-4">
                    {/* Saved Vehicles Dropdown */}
                    <div>
                      {loadingVehicles ? (
                        <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading your vehicles...
                        </div>
                      ) : userVehicles.length > 0 ? (
                        <div className="relative">
                          <select
                            value={searchData.selectedVehicleId}
                            onChange={(e) => {
                              const selectedVehicle = userVehicles.find(v => v.id === e.target.value);
                              setSearchData(prev => ({
                                ...prev,
                                vehicleOption: 'saved',
                                selectedVehicleId: e.target.value,
                                vehicle: {
                                  length: selectedVehicle.length,
                                  width: selectedVehicle.width,
                                  height: selectedVehicle.height
                                }
                              }));
                            }}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm appearance-none bg-white cursor-pointer transition-all duration-200 ${
                              searchData.vehicleOption === 'saved'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: 'right 0.75rem center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '1.5em 1.5em',
                              paddingRight: '2.5rem'
                            }}
                          >
                            {userVehicles.map(vehicle => (
                              <option key={vehicle.id} value={vehicle.id} className="py-3 flex items-center">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                                {vehicle.isPrimary && ' (Primary)'}
                                {' • 🇧🇪 '}
                                {vehicle.license_plate}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="w-full px-4 py-3 border-2 border-yellow-300 rounded-xl bg-yellow-50 text-sm text-yellow-700">
                          No vehicles found. Add a vehicle to your profile first.
                        </div>
                      )}
                    </div>
                    
                    {/* Custom Dimensions Option */}
                    <button
                      onClick={() => setSearchData(prev => ({ 
                        ...prev, 
                        vehicleOption: 'custom',
                        vehicle: { length: 480, width: 200, height: 200 }
                      }))}
                      className={`w-full px-4 py-3 border-2 border-dashed rounded-xl transition-all text-sm font-medium ${
                        searchData.vehicleOption === 'custom'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Settings className="w-4 h-4" />
                        Custom Dimensions
                      </div>
                    </button>

                    {/* Skip Vehicle Specifications */}
                    <button
                      onClick={() => setSearchData(prev => ({ ...prev, vehicleOption: 'skip' }))}
                      className={`w-full px-4 py-3 border-2 border-dashed rounded-xl transition-all text-sm font-medium ${
                        searchData.vehicleOption === 'skip'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <X className="w-4 h-4" />
                        Skip Vehicle Specifications
                      </div>
                    </button>
                  </div>
                </div>

                {/* Right Side - Vehicle Details & Editor */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {searchData.vehicleOption === 'custom' ? 'Vehicle Dimensions' : 'Selected Vehicle'}
                  </h4>
                  
                  <div className="border-2 border-gray-200 rounded-xl p-4 min-h-[300px]">
                    {searchData.vehicleOption === 'skip' ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <X className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="text-sm text-gray-600">Vehicle dimensions skipped</p>
                        <p className="text-xs text-gray-500 mt-1">Search without size filters</p>
                      </div>
                    ) : searchData.vehicleOption === 'custom' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Length (cm) *</label>
                            <input
                              type="number"
                              value={searchData.vehicle.length}
                              onChange={(e) => setSearchData(prev => ({ 
                                ...prev, 
                                vehicle: { ...prev.vehicle, length: parseInt(e.target.value) || 0 }
                              }))}
                              placeholder="480"
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Width (cm) *</label>
                            <input
                              type="number"
                              value={searchData.vehicle.width}
                              onChange={(e) => setSearchData(prev => ({ 
                                ...prev, 
                                vehicle: { ...prev.vehicle, width: parseInt(e.target.value) || 0 }
                              }))}
                              placeholder="200"
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Height (cm)</label>
                          <input
                            type="number"
                            value={searchData.vehicle.height}
                            onChange={(e) => setSearchData(prev => ({ 
                              ...prev, 
                              vehicle: { ...prev.vehicle, height: parseInt(e.target.value) || 0 }
                            }))}
                            placeholder="200"
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          />
                        </div>
                        
                        {/* Vehicle Size Presets */}
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-2">Quick Presets:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { name: 'Small Car', length: 400, width: 170, height: 150 },
                              { name: 'Standard Car', length: 480, width: 180, height: 150 },
                              { name: 'SUV', length: 520, width: 200, height: 180 },
                              { name: 'Van', length: 600, width: 220, height: 250 }
                            ].map(preset => (
                              <button
                                key={preset.name}
                                onClick={() => setSearchData(prev => ({ 
                                  ...prev, 
                                  vehicle: { length: preset.length, width: preset.width, height: preset.height }
                                }))}
                                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded font-medium transition-all"
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(() => {
                          const selectedVehicle = userVehicles.find(v => 
                            v.length === searchData.vehicle.length && 
                            v.width === searchData.vehicle.width
                          );
                          
                          return (
                            <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                              <div className="flex items-center gap-3">
                                {/* Car Brand Logo */}
                                <div className="w-10 h-10 bg-gray-50 rounded-lg p-1 flex items-center justify-center">
                                  <CarBrandLogo make={selectedVehicle?.make} className="w-8 h-8" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                      {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
                                    </h3>
                                    {selectedVehicle?.isPrimary && (
                                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium shrink-0">
                                        Primary
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    {/* Belgian License Plate */}
                                    <div className="flex items-center">
                                      <div className="bg-white border-2 border-red-600 rounded-md px-3 py-1.5 font-mono text-sm font-bold text-red-700 tracking-wider shadow-sm">
                                        <div className="flex items-center gap-2">
                                          <span className="text-red-600 font-bold">��</span>
                                          <span className="text-red-700">{selectedVehicle?.license_plate || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Color Swatch Only */}
                                    <div className="flex items-center">
                                      <div className={`w-5 h-5 rounded-full ${getColorSwatch(selectedVehicle?.color)} shadow-sm border border-gray-200`}></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Dimensions */}
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">Dimensions</span>
                                  <span className="text-sm text-gray-700 font-medium">
                                    {searchData.vehicle.length} × {searchData.vehicle.width} × {searchData.vehicle.height} cm
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Settings className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Preferences</h3>
                <p className="text-gray-600">Customize your search with these options</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Amenities */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Amenities</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(amenitiesConfig).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSearchData(prev => ({
                          ...prev,
                          amenities: { ...prev.amenities, [key]: !prev.amenities[key] }
                        }))}
                        className={`w-full px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all duration-200 ${
                          searchData.amenities[key]
                            ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <config.icon size={14} />
                          {searchData.amenities[key] && <Check size={12} />}
                          <span className="truncate">{config.label}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Preferences */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Additional Preferences</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(preferencesConfig).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSearchData(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, [key]: !prev.preferences[key] }
                        }))}
                        className={`w-full px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all duration-200 ${
                          searchData.preferences[key]
                            ? 'bg-blue-100 border-blue-500 text-blue-700 hover:bg-blue-200'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <config.icon size={14} />
                          {searchData.preferences[key] && <Check size={12} />}
                          <span className="truncate">{config.label}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={step === 1 ? onClose : handleBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
            disabled={loading}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <button
            onClick={step === steps.length ? handleSearch : handleNext}
            disabled={!canProceed() || loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {step === steps.length ? 'Search Parking' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}