import { useState, useEffect } from 'react';
import { createClientComponentClient, createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { X, Car, Search, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { vehicleService } from '../lib/database';

export default function AddVehicleModal({ onClose, onSave, userId, editingVehicle = null }) {
  const [step, setStep] = useState(1); // 1: Make/Model, 2: Details, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: '',
    color: '#000000',
    license_plate: '',
    length_cm: null,
    width_cm: null,
    height_cm: null,
    weight_kg: null,
    is_primary: false
  });
  const [existingVehicles, setExistingVehicles] = useState([]);
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    loadMakes();
    loadExistingVehicles();
    if (editingVehicle) {
      setVehicleData(editingVehicle);
      setStep(2); // Skip to details if editing
    }
  }, [editingVehicle]);

  const loadExistingVehicles = async () => {
    try {
      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId);
      setExistingVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadMakes = async () => {
    setSearchLoading(true);
    try {
      const response = await fetch('/api/carquery/makes');
      if (response.ok) {
        const data = await response.json();
        setMakes(data.Makes || []);
      }
    } catch (error) {
      console.error('Error loading makes:', error);
      toast.error('Failed to load vehicle makes');
    } finally {
      setSearchLoading(false);
    }
  };

  const loadModels = async (make) => {
    if (!make) return;
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/carquery/models?make=${encodeURIComponent(make)}`);
      if (response.ok) {
        const data = await response.json();
        setModels(data.Models || []);
        
        // Get available years for this make
        const yearSet = new Set();
        data.Models.forEach(model => {
          if (model.model_year) {
            yearSet.add(parseInt(model.model_year));
          }
        });
        const sortedYears = Array.from(yearSet).sort((a, b) => b - a);
        setYears(sortedYears);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      toast.error('Failed to load vehicle models');
    } finally {
      setSearchLoading(false);
    }
  };

  const loadVehicleSpecs = async (make, model, year) => {
    if (!make || !model || !year) return;
    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/carquery/specs?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.Trims && data.Trims.length > 0) {
          const trim = data.Trims[0]; // Use first trim as default
          setVehicleData(prev => ({
            ...prev,
            length_cm: trim.model_length_mm ? Math.round(trim.model_length_mm / 10) : null,
            width_cm: trim.model_width_mm ? Math.round(trim.model_width_mm / 10) : null,
            height_cm: trim.model_height_mm ? Math.round(trim.model_height_mm / 10) : null,
            weight_kg: trim.model_weight_kg ? parseInt(trim.model_weight_kg) : null
          }));
        }
      }
    } catch (error) {
      console.error('Error loading vehicle specs:', error);
      toast.error('Failed to load vehicle specifications');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMakeChange = (make) => {
    setVehicleData(prev => ({ ...prev, make, model: '', year: '' }));
    setModels([]);
    setYears([]);
    if (make) {
      loadModels(make);
    }
  };

  const handleModelChange = (model) => {
    setVehicleData(prev => ({ ...prev, model, year: '' }));
  };

  const handleYearChange = (year) => {
    setVehicleData(prev => ({ ...prev, year }));
    if (vehicleData.make && vehicleData.model && year) {
      loadVehicleSpecs(vehicleData.make, vehicleData.model, year);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!vehicleData.make || !vehicleData.model || !vehicleData.year) {
        toast.error('Please select make, model, and year');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!vehicleData.license_plate.trim()) {
        toast.error('Please enter a license plate');
        return;
      }
      setStep(3);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Check if license plate already exists
      const { data: existing } = await supabase
        .from('vehicles')
        .select('id')
        .eq('license_plate', vehicleData.license_plate)
        .eq('user_id', userId)
        .neq('id', editingVehicle?.id || '');

      if (existing && existing.length > 0) {
        toast.error('A vehicle with this license plate already exists');
        setLoading(false);
        return;
      }

      // If this is the first vehicle or set as primary, make it primary
      const shouldBePrimary = vehicleData.is_primary || existingVehicles.length === 0;

      // If setting as primary, remove primary from other vehicles first
      if (shouldBePrimary) {
        await supabase
          .from('vehicles')
          .update({ is_primary: false })
          .eq('user_id', userId);
      }

      const vehiclePayload = {
        ...vehicleData,
        user_id: userId,
        is_primary: shouldBePrimary
      };

      let result;
      if (editingVehicle) {
        result = await supabase
          .from('vehicles')
          .update(vehiclePayload)
          .eq('id', editingVehicle.id)
          .select();
      } else {
        result = await supabase
          .from('vehicles')
          .insert(vehiclePayload)
          .select();
      }

      if (result.error) throw result.error;

      toast.success(editingVehicle ? 'Vehicle updated successfully' : 'Vehicle added successfully');
      onSave(result.data[0]); // Pass the updated/created vehicle data back
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error('Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const commonColors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Silver', value: '#C0C0C0' },
    { name: 'Gray', value: '#808080' },
    { name: 'Red', value: '#FF0000' },
    { name: 'Blue', value: '#0000FF' },
    { name: 'Green', value: '#008000' },
    { name: 'Yellow', value: '#FFFF00' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Step {step} of 3: {step === 1 ? 'Select Vehicle' : step === 2 ? 'Vehicle Details' : 'Confirmation'}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={24} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex space-x-2">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`flex-1 h-2 rounded-full ${
                  stepNum <= step ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Vehicle Selection */}
          {step === 1 && !editingVehicle && (
            <div className="space-y-6">
              <div className="text-center">
              <img 
                src="/logos/logo_dark.png" 
                alt="ParkShift Logo" 
                className="w-16 h-16 mx-auto mb-4"
              />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Select Your Vehicle
              </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose your vehicle make, model, and year to get exact specifications
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Make */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Make
                  </label>
                  <select
                    value={vehicleData.make}
                    onChange={(e) => handleMakeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={searchLoading}
                  >
                    <option value="">Select Make</option>
                    {makes.map((make) => (
                      <option key={make.make_id} value={make.make_display}>
                        {make.make_display}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Model
                  </label>
                  <select
                    value={vehicleData.model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={!vehicleData.make || searchLoading}
                  >
                    <option value="">Select Model</option>
                    {models.map((model, index) => (
                      <option key={index} value={model.model_name}>
                        {model.model_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year
                  </label>
                  <select
                    value={vehicleData.year}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={!vehicleData.model || searchLoading}
                  >
                    <option value="">Select Year</option>
                    {(() => {
                      const currentYear = new Date().getFullYear();
                      const years = [];
                      for (let year = currentYear; year >= currentYear - 50; year--) {
                        years.push(
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      }
                      return years;
                    })()}
                  </select>
                </div>
              </div>

              {searchLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading vehicle data...</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Vehicle Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Vehicle Details
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {vehicleData.make} {vehicleData.model} ({vehicleData.year})
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* License Plate */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    value={vehicleData.license_plate}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, license_plate: e.target.value.toUpperCase() }))}
                    placeholder="ABC-123"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Color */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {commonColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setVehicleData(prev => ({ ...prev, color: color.value }))}
                        className={`w-8 h-8 rounded-full border-2 ${
                          vehicleData.color === color.value ? 'border-green-500' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={vehicleData.color}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>

                {/* Dimensions (auto-filled from API) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    value={vehicleData.length_cm || ''}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, length_cm: parseInt(e.target.value) || null }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    value={vehicleData.width_cm || ''}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, width_cm: parseInt(e.target.value) || null }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={vehicleData.height_cm || ''}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, height_cm: parseInt(e.target.value) || null }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={vehicleData.weight_kg || ''}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, weight_kg: parseInt(e.target.value) || null }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Primary Vehicle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={vehicleData.is_primary}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, is_primary: e.target.checked }))}
                  className="w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500"
                />
                <label htmlFor="isPrimary" className="text-sm text-gray-700 dark:text-gray-300">
                  Set as primary vehicle
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Check className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Confirm Vehicle Details
                </h3>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Vehicle:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {vehicleData.make} {vehicleData.model} ({vehicleData.year})
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">License Plate:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{vehicleData.license_plate}</span>
                  </div>
                  {vehicleData.length_cm && vehicleData.width_cm && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Dimensions:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">
                        {(vehicleData.length_cm / 100).toFixed(1)}m × {(vehicleData.width_cm / 100).toFixed(1)}m
                        {vehicleData.height_cm && ` × ${(vehicleData.height_cm / 100).toFixed(1)}m`}
                      </span>
                    </div>
                  )}
                  {vehicleData.is_primary && (
                    <div>
                      <span className="font-medium text-green-600 dark:text-green-400">Primary Vehicle</span>
                    </div>
                  )}
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
            disabled={loading}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <button
            onClick={step === 3 ? handleSave : handleNextStep}
            disabled={loading || searchLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {step === 3 ? (editingVehicle ? 'Update Vehicle' : 'Add Vehicle') : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
