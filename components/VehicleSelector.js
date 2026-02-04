import { useState, useEffect } from 'react';
import { createClientComponentClient, createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { Car, Plus, ChevronDown } from 'lucide-react';
import AddVehicleModal from './AddVehicleModal';
import { vehicleService } from '../lib/database';

export default function VehicleSelector({ userId, selectedVehicle, onVehicleSelect }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    if (userId) {
      loadVehicles();
    }
  }, [userId]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getUserVehicles(supabase, userId);
      setVehicles(data);

      // Auto-select primary vehicle if no vehicle is selected
      if (!selectedVehicle && data?.length > 0) {
        const primaryVehicle = data.find(v => v.is_primary) || data[0];
        onVehicleSelect(primaryVehicle);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = (vehicle) => {
    onVehicleSelect(vehicle);
    setShowDropdown(false);
  };

  const handleAddVehicle = async (vehicleData) => {
    try {
      const newVehicle = await vehicleService.addVehicle(supabase, vehicleData);
      setVehicles([...vehicles, newVehicle]);
      setShowAddModal(false);
      onVehicleSelect(newVehicle);
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast.error('Failed to add vehicle');
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

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

  if (vehicles.length === 0) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add your first vehicle
        </button>
        
        {showAddModal && (
          <AddVehicleModal
            onClose={() => setShowAddModal(false)}
            onSave={() => {
              setShowAddModal(false);
              loadVehicles();
            }}
            userId={userId}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Car size={16} className="text-gray-400" />
          {selectedVehicle ? (
            <div>
              <div className="font-medium">
                {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                  <LicensePlate plate={selectedVehicle.license_plate} />
                {selectedVehicle.length_cm && selectedVehicle.width_cm && (
                  <span className="ml-2">
                    {(selectedVehicle.length_cm / 100).toFixed(1)}m × {(selectedVehicle.width_cm / 100).toFixed(1)}m
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Select a vehicle</span>
          )}
        </div>
        <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => handleVehicleSelect(vehicle)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                  selectedVehicle?.id === vehicle.id ? 'bg-green-50 dark:bg-green-900/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" style={{ backgroundColor: vehicle.color || '#6B7280' }}></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                      {vehicle.is_primary && <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">Primary</span>}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        <LicensePlate plate={vehicle.license_plate} />
                      {vehicle.length_cm && vehicle.width_cm && (
                        <span className="ml-2">
                          {(vehicle.length_cm / 100).toFixed(1)}m × {(vehicle.width_cm / 100).toFixed(1)}m
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            
            {vehicles.length < 5 && (
              <button
                onClick={() => {
                  setShowAddModal(true);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-green-600 dark:text-green-400 font-medium flex items-center gap-2"
              >
                <Plus size={16} />
                Add another vehicle
              </button>
            )}
          </div>
        </>
      )}

      {showAddModal && (
        <AddVehicleModal
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            loadVehicles();
          }}
          userId={userId}
        />
      )}
    </div>
  );
}
