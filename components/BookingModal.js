import { useState, useEffect } from 'react';
import { createClientComponentClient, createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { X, Car, Calendar, MapPin, CreditCard, Check, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { bookingService, vehicleService } from '../lib/database';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ space, user, selectedVehicle, selectedDates, totalAmount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [useNewCard, setUseNewCard] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      setPaymentMethods(data || []);
      
      // Auto-select default payment method
      const defaultMethod = data?.find(pm => pm.is_default);
      if (defaultMethod && !useNewCard) {
        setSelectedPaymentMethod(defaultMethod);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const calculateDuration = () => {
    if (selectedDates.isHourly) {
      const startTime = selectedDates.startTime.split(':');
      const endTime = selectedDates.endTime.split(':');
      const startHour = parseInt(startTime[0]) + parseInt(startTime[1]) / 60;
      const endHour = parseInt(endTime[0]) + parseInt(endTime[1]) / 60;
      return { hours: endHour - startHour, days: 0 };
    } else {
      const daysDiff = Math.ceil((selectedDates.endDate - selectedDates.startDate) / (1000 * 60 * 60 * 24));
      return { hours: 0, days: daysDiff };
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create booking record first
      const duration = calculateDuration();
      const startDateTime = selectedDates.isHourly 
        ? new Date(`${format(selectedDates.startDate, 'yyyy-MM-dd')}T${selectedDates.startTime}:00`)
        : selectedDates.startDate;
      const endDateTime = selectedDates.isHourly
        ? new Date(`${format(selectedDates.startDate, 'yyyy-MM-dd')}T${selectedDates.endTime}:00`)
        : selectedDates.endDate;

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          space_id: space.id,
          renter_id: user.id,
          vehicle_id: selectedVehicle.id,
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString(),
          total_amount: totalAmount,
          special_requests: specialRequests,
          status: 'pending'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100), // Convert to cents
          booking_id: booking.id,
          space_id: space.id,
          payment_method_id: selectedPaymentMethod?.stripe_payment_method_id
        })
      });

      const { client_secret } = await response.json();

      let result;
      if (useNewCard) {
        // Confirm payment with new card
        result = await stripe.confirmCardPayment(client_secret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
            },
          },
        });
      } else {
        // Confirm payment with existing payment method
        result = await stripe.confirmCardPayment(client_secret);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Update booking with payment intent ID
      await supabase
        .from('bookings')
        .update({
          stripe_payment_intent_id: result.paymentIntent.id,
          status: 'confirmed'
        })
        .eq('id', booking.id);

      // Create notification for space owner
      await supabase
        .from('notifications')
        .insert({
          user_id: space.owner_id,
          type: 'booking',
          title: 'New Booking Request',
          message: `You have a new booking for ${space.title}`,
          data: { booking_id: booking.id, space_id: space.id }
        });

      toast.success('Booking confirmed successfully!');
      onSuccess(booking);

    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Booking failed. Please try again.');
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  const duration = calculateDuration();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Booking Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Booking Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Space:</span>
            <span className="text-gray-900 dark:text-gray-100">{space.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Vehicle:</span>
            <span className="text-gray-900 dark:text-gray-100">
              {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.license_plate})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Duration:</span>
            <span className="text-gray-900 dark:text-gray-100">
              {duration.hours > 0 ? `${duration.hours} hours` : `${duration.days} days`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Dates:</span>
            <span className="text-gray-900 dark:text-gray-100">
              {selectedDates.isHourly ? (
                `${format(selectedDates.startDate, 'MMM d')} ${selectedDates.startTime}-${selectedDates.endTime}`
              ) : (
                `${format(selectedDates.startDate, 'MMM d')} - ${format(selectedDates.endDate, 'MMM d')}`
              )}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">Total:</span>
            <span className="font-bold text-green-600 dark:text-green-400">€{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Special Requests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Special Requests (Optional)
        </label>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          rows={3}
          placeholder="Any special requests or instructions for the space owner..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Payment Method Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Payment Method</h3>
        
        {paymentMethods.length > 0 && (
          <div className="space-y-3 mb-4">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPaymentMethod?.id === method.id && !useNewCard
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={selectedPaymentMethod?.id === method.id && !useNewCard}
                  onChange={() => {
                    setSelectedPaymentMethod(method);
                    setUseNewCard(false);
                  }}
                  className="sr-only"
                />
                <CreditCard size={20} className="text-gray-400" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    **** **** **** {method.card_last4}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {method.card_brand?.toUpperCase()} • Expires {method.card_exp_month}/{method.card_exp_year}
                    {method.is_default && <span className="ml-2 text-green-600">Default</span>}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Use New Card Option */}
        <label
          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
            useNewCard
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            checked={useNewCard}
            onChange={() => {
              setUseNewCard(true);
              setSelectedPaymentMethod(null);
            }}
            className="sr-only"
          />
          <CreditCard size={20} className="text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-gray-100">Use new card</span>
        </label>

        {/* New Card Form */}
        {useNewCard && (
          <div className="mt-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
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
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !stripe || (!selectedPaymentMethod && !useNewCard)}
        className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Check size={16} />
            Confirm Booking - €{totalAmount.toFixed(2)}
          </>
        )}
      </button>
    </form>
  );
};

export default function BookingModal({ space, user, onSuccess, onCancel }) {
  const calculateTotalPrice = () => {
    if (selectedDates.isHourly) {
      const startTime = selectedDates.startTime.split(':');
      const endTime = selectedDates.endTime.split(':');
      const startHour = parseInt(startTime[0]) + parseInt(startTime[1]) / 60;
      const endHour = parseInt(endTime[0]) + parseInt(endTime[1]) / 60;
      const hours = endHour - startHour;
      return hours * space.hourly_price;
    } else {
      const daysDiff = Math.ceil((selectedDates.endDate - selectedDates.startDate) / (1000 * 60 * 60 * 24));
      return daysDiff * space.daily_price;
    }
  };

  const totalAmount = calculateTotalPrice();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Complete Your Booking
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Elements stripe={stripePromise}>
            <CheckoutForm
              space={space}
              user={user}
              selectedVehicle={selectedVehicle}
              selectedDates={selectedDates}
              totalAmount={totalAmount}
              onSuccess={onSuccess}
              onError={(error) => {
                console.error('Booking error:', error);
              }}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
}
