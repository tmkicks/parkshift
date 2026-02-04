import { useState, useEffect } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { vehicleService } from '../lib/database';
import { Car, Plus, Trash2, Edit } from 'lucide-react';
import AddVehicleModal from './AddVehicleModal';
import { CarBrandLogo } from './CarBrandLogos';
import toast from 'react-hot-toast';

// Car brand logo component - now using real SVG logos
const CarBrandLogoOld = ({ make, className = "w-8 h-8" }) => {
  const brandLogos = {
    'BMW': '🔵',
    'Mercedes-Benz': '⭐',
    'Audi': '🔲',
    'Volkswagen': '🔘',
    'Toyota': '🔴',
    'Honda': '🔳',
    'Ford': '🔷',
    'Nissan': '⚫',
    'Peugeot': '🦁',
    'Renault': '💎'
  };
  
  return (
    <div className={`${className} flex items-center justify-center text-lg`}>
      {brandLogos[make] || '🚗'}
    </div>
  );
};

// License plate component with country-specific styling
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

// Looking for VehicleManager component
export default function VehicleManager({ userId }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    if (userId) {
      fetchVehicles();
    }
  }, [userId]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getUserVehicles(supabase, userId);
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      await vehicleService.deleteVehicle(supabase, vehicleId);
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      toast.success('Vehicle deleted successfully');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    }
  };

  const handleSetPrimary = async (vehicleId) => {
    try {
      // First, set all vehicles to non-primary for this user
      await supabase
        .from('vehicles')
        .update({ is_primary: false })
        .eq('user_id', userId);

      // Then set the selected vehicle as primary
      await supabase
        .from('vehicles')
        .update({ is_primary: true })
        .eq('id', vehicleId)
        .eq('user_id', userId);

      // Update local state to reflect changes
      setVehicles(vehicles.map(v => ({
        ...v,
        is_primary: v.id === vehicleId
      })));
      
      toast.success('Primary vehicle updated');
    } catch (error) {
      console.error('Error setting primary vehicle:', error);
      toast.error('Failed to update primary vehicle');
    }
  };

  const handleAddSuccess = (updatedVehicle) => {
    if (editingVehicle) {
      // When editing, either use the returned data or refetch to be safe
      if (updatedVehicle && updatedVehicle.id) {
        setVehicles(vehicles.map(v => 
          v.id === editingVehicle.id ? { ...v, ...updatedVehicle } : v
        ));
      } else {
        // Fallback: refetch all vehicles if no data returned
        fetchVehicles();
      }
      setEditingVehicle(null);
    } else {
      // When adding new, append to the list
      if (updatedVehicle && updatedVehicle.id) {
        setVehicles([...vehicles, updatedVehicle]);
      } else {
        // Fallback: refetch all vehicles
        fetchVehicles();
      }
    }
    setShowAddModal(false);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingVehicle(null);
  };

  // Sort vehicles to show primary first
  const sortedVehicles = vehicles.sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return 0;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Vehicles</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={16} />
          Add Vehicle
        </button>
      </div>

      <div className="space-y-4">
        {sortedVehicles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Car size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No vehicles added yet</p>
            <p className="text-sm">Add your first vehicle to start booking parking spaces</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-3">
              Click any vehicle to set it as your primary vehicle
            </div>
            {sortedVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => !vehicle.is_primary && handleSetPrimary(vehicle.id)}
                className={`p-4 border rounded-lg transition-all cursor-pointer ${
                  vehicle.is_primary
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                    : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CarBrandLogo make={vehicle.make} className="w-12 h-12" />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {vehicle.make} {vehicle.model}
                        </h3>
                        {vehicle.is_primary && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            Primary
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{vehicle.year}</span>
                        <LicensePlate plate={vehicle.license_plate} />
                        {vehicle.color && (
                          <div className="flex items-center gap-1">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: vehicle.color }}
                            />
                            <span>Color</span>
                          </div>
                        )}
                      </div>
                      
                      {(vehicle.length_cm || vehicle.width_cm) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {vehicle.length_cm && vehicle.width_cm && 
                            `${(vehicle.length_cm / 100).toFixed(1)}m × ${(vehicle.width_cm / 100).toFixed(1)}m`
                          }
                          {vehicle.height_cm && ` × ${(vehicle.height_cm / 100).toFixed(1)}m`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingVehicle(vehicle);
                        setShowAddModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit vehicle"
                    >
                      <Edit size={16} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVehicle(vehicle.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      disabled={vehicle.is_primary}
                      title={vehicle.is_primary ? 'Cannot delete primary vehicle' : 'Delete vehicle'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {showAddModal && (
        <AddVehicleModal
          userId={userId}
          onSave={handleAddSuccess}
          onClose={handleModalClose}
          editingVehicle={editingVehicle}
        />
      )}
    </div>
  );
}