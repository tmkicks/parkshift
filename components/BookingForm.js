import { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Calendar, Clock, Car, CreditCard, MapPin, Euro, AlertCircle } from 'lucide-react';
import { bookingService, paymentService } from '../lib/database';
import { format, addDays, differenceInHours, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

export default function BookingForm({ space, userVehicles, user, onBookingComplete }) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [formData, setFormData] = useState({
    startDate: new Date(),
    endDate: new Date(),
    startTime: '09:00',
    endTime: '17:00',
    vehicleId: userVehicles.find(v => v.is_primary)?.id || userVehicles[0]?.id || '',
    specialRequests: ''
  });
  
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [showNewCard, setShowNewCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState({ hours: 0, amount: 0, type: 'hourly' });

  useEffect(() => {
    loadPaymentMethods();
    calculatePricing();
  }, []);

  useEffect(() => {
    calculatePricing();
  }, [formData.startDate, formData.endDate, formData.startTime, formData.endTime]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentService.getUserPaymentMethods(user.id);
      setPaymentMethods(methods);
      
      // Select default payment method
      const defaultMethod = methods.find(m => m.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.id);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const calculatePricing = () => {
    const start = new Date(`${formData.startDate.toDateString()} ${formData.startTime}`);
    const end = new Date(`${formData.endDate.toDateString()} ${formData.endTime}`);
    
    const hours = Math.ceil(differenceInHours(end, start));
    const days = Math.ceil(differenceInDays(end, start));
    
    let amount;
    let type;
    
    if (hours >= 24) {
      // Use daily rate if booking is 24+ hours
      amount = Math.ceil(hours / 24) * space.daily_price;
      type = 'daily';
    } else {
      // Use hourly rate
      amount = hours * space.hourly_price;
      type = 'hourly';
    }
    
    setPricing({ hours, amount, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    
    try {
      // Validate form
      if (!formData.vehicleId) {
        toast.error('Please select a vehicle');
        return;
      }

      const selectedVehicle = userVehicles.find(v => v.id === formData.vehicleId);
      
      // Check vehicle dimensions against space
      if (selectedVehicle.length_cm > space.length_cm || 
          selectedVehicle.width_cm > space.width_cm ||
          (selectedVehicle.height_cm && space.height_cm && selectedVehicle.height_cm > space.height_cm)) {
        toast.error('Selected vehicle is too large for this parking space');
        return;
      }

      let paymentMethodId = selectedPaymentMethod;

      // Handle new card payment
      if (showNewCard) {
        const card = elements.getElement(CardElement);
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card,
        });

        if (error) {
          toast.error(error.message);
          return;
        }
        
        paymentMethodId = paymentMethod.id;
      }

      // Create booking with payment
      const bookingData = {
        space_id: space.id,
        renter_id: user.id,
        vehicle_id: formData.vehicleId,
        start_datetime: new Date(`${formData.startDate.toDateString()} ${formData.startTime}`),
        end_datetime: new Date(`${formData.endDate.toDateString()} ${formData.endTime}`),
        total_amount: pricing.amount,
        special_requests: formData.specialRequests,
        payment_method_id: paymentMethodId
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create booking');
      }

      const booking = await response.json();
      
      // Handle payment confirmation if needed
      if (booking.requires_action) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          booking.client_secret,
          {
            payment_method: paymentMethodId
          }
        );

        if (confirmError) {
          toast.error(confirmError.message);
          return;
        }
      }

      toast.success('Booking confirmed!');
      onBookingComplete(booking);
      
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to complete booking');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        value: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour.toString().padStart(2, '0')}:00`
      });
      slots.push({
        value: `${hour.toString().padStart(2, '0')}:30`,
        label: `${hour.toString().padStart(2, '0')}:30`
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Booking</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date & Time Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar size={20} />
            When do you need parking?
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={format(formData.startDate, 'yyyy-MM-dd')}
                onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={format(formData.endDate, 'yyyy-MM-dd')}
                onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
                min={format(formData.startDate, 'yyyy-MM-dd')}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <select
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {timeSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <select
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {timeSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Vehicle Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Car size={20} />
            Select Vehicle
          </h3>
          
          {userVehicles.length > 0 ? (
            <div className="space-y-2">
              {userVehicles.map((vehicle) => (
                <label
                  key={vehicle.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                    formData.vehicleId === vehicle.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="vehicle"
                    value={vehicle.id}
                    checked={formData.vehicleId === vehicle.id}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-sm text-gray-600">
                      {vehicle.license_plate} • {vehicle.length_cm}×{vehicle.width_cm}×{vehicle.height_cm}cm
                    </div>
                  </div>
                  {vehicle.is_primary && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Primary
                    </span>
                  )}
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-2">No vehicles found</p>
              <button
                type="button"
                onClick={() => window.open('/profile?tab=vehicles', '_blank')}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Add a vehicle to continue
              </button>
            </div>
          )}
        </div>

        {/* Special Requests */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Special Requests (Optional)
          </h3>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
            placeholder="Any special instructions or requests for the space owner..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard size={20} />
            Payment Method
          </h3>
          
          {/* Existing Payment Methods */}
          {paymentMethods.length > 0 && !showNewCard && (
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                    selectedPaymentMethod === method.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedPaymentMethod === method.id}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 capitalize">
                      {method.card_brand} •••• {method.card_last4}
                    </div>
                    <div className="text-sm text-gray-600">
                      Expires {method.card_exp_month?.toString().padStart(2, '0')}/{method.card_exp_year?.toString().slice(-2)}
                    </div>
                  </div>
                  {method.is_default && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </label>
              ))}
              
              <button
                type="button"
                onClick={() => setShowNewCard(true)}
                className="w-full p-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
              >
                + Use a different card
              </button>
            </div>
          )}
          
          {/* New Card Form */}
          {(showNewCard || paymentMethods.length === 0) && (
            <div className="space-y-4">
              <div className="p-4 border border-gray-300 rounded-lg">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                    },
                  }}
                />
              </div>
              
              {paymentMethods.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewCard(false)}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  ← Use existing payment method
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Euro size={20} />
            Booking Summary
          </h3>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>{pricing.hours} hour{pricing.hours !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span>Rate:</span>
              <span>
                {pricing.type === 'daily' 
                  ? `€${space.daily_price}/day`
                  : `€${space.hourly_price}/hour`
                }
              </span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span>€{pricing.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !stripe || (!selectedPaymentMethod && !showNewCard) || !formData.vehicleId}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : `Confirm Booking - €${pricing.amount.toFixed(2)}`}
        </button>
        
        <div className="text-xs text-gray-500 text-center">
          <AlertCircle className="inline w-4 h-4 mr-1" />
          You will be charged immediately. Cancellation policy applies.
        </div>
      </form>
    </div>
  );
}
