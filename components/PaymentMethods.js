import { useState, useEffect } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Plus, Trash2, Lock, Check } from 'lucide-react';
import toast from 'react-hot-toast';

// Quick fix for stripePromise error - ensure it's properly defined
const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Card brand icons
const CardBrandIcon = ({ brand, className = "w-8 h-5" }) => {
  const brandIcons = {
    visa: (
      <div className={`${className} bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold`}>
        VISA
      </div>
    ),
    mastercard: (
      <div className={`${className} bg-red-500 rounded flex items-center justify-center`}>
        <div className="flex">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full -ml-1"></div>
        </div>
      </div>
    ),
    amex: (
      <div className={`${className} bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold`}>
        AMEX
      </div>
    ),
    discover: (
      <div className={`${className} bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold`}>
        DISC
      </div>
    ),
    diners: (
      <div className={`${className} bg-gray-600 rounded flex items-center justify-center text-white text-xs font-bold`}>
        DC
      </div>
    ),
    jcb: (
      <div className={`${className} bg-blue-800 rounded flex items-center justify-center text-white text-xs font-bold`}>
        JCB
      </div>
    ),
    unionpay: (
      <div className={`${className} bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold`}>
        UP
      </div>
    ),
    unknown: (
      <CreditCard className={`${className} text-gray-600`} />
    )
  };

  return brandIcons[brand?.toLowerCase()] || brandIcons.unknown;
};

// Card input styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

function AddPaymentMethodForm({ onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error('Stripe not loaded');
      return;
    }

    setLoading(true);

    try {
      // Get the card element
      const cardElement = elements.getElement(CardElement);

      // Create payment method
      console.log('Creating payment method...');
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        console.error('Payment method creation error:', error);
        toast.error(error.message);
        return;
      }

      console.log('Created payment method:', paymentMethod);
      console.log('Payment method ID:', paymentMethod.id);

      // Send to API
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          paymentMethodId: paymentMethod.id 
        }),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to save payment method');
      }

      const savedPaymentMethod = await response.json();
      console.log('Saved payment method:', savedPaymentMethod);

      toast.success('Payment method added successfully');
      onSuccess(savedPaymentMethod);
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error(error.message || 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Add Payment Method</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="p-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Lock size={16} />
          <span>Your payment information is securely encrypted</span>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!stripe || loading}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Payment Method'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function PaymentMethodCard({ paymentMethod, onDelete, onSetDefault, isDefault }) {
  const [loading, setLoading] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);

  const handleDelete = async () => {
    if (isDefault) {
      toast.error('Cannot delete default payment method. Set another as default first.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/payment-methods/${paymentMethod.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }

      toast.success('Payment method deleted');
      onDelete(paymentMethod.id);
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async () => {
    if (isDefault) return;

    setSettingDefault(true);
    try {
      const response = await fetch('/api/payment-methods/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: paymentMethod.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to set default payment method');
      }

      toast.success('Default payment method updated');
      onSetDefault(paymentMethod.id);
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set as default');
    } finally {
      setSettingDefault(false);
    }
  };

  // Format expiration year to 2 digits
  const formatExpYear = (year) => {
    return year.toString().slice(-2);
  };

  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isDefault 
          ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
      }`}
      onClick={handleSetDefault}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CardBrandIcon brand={paymentMethod.card_brand} />
          <div>
            <div className="font-medium flex items-center gap-2">
              {paymentMethod.card_brand?.toUpperCase()} •••• {paymentMethod.card_last4}
              {isDefault && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check size={16} />
                  <span className="text-sm">Default</span>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Expires {String(paymentMethod.card_exp_month).padStart(2, '0')}/{formatExpYear(paymentMethod.card_exp_year)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {settingDefault && (
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={loading || isDefault}
            className={`p-2 rounded-lg disabled:opacity-50 ${
              isDefault 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-red-600 hover:bg-red-50'
            }`}
            title={isDefault ? 'Cannot delete default payment method' : 'Delete payment method'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentMethods({ userId }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState(null);
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods');
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      const methods = await response.json();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = (newPaymentMethod) => {
    setPaymentMethods([...paymentMethods, newPaymentMethod]);
    setShowAddForm(false);
  };

  const handleDelete = (paymentMethodId) => {
    setPaymentMethods(paymentMethods.filter(pm => pm.id !== paymentMethodId));
  };

  const handleSetDefault = (paymentMethodId) => {
    setPaymentMethods(paymentMethods.map(pm => ({
      ...pm,
      is_default: pm.id === paymentMethodId
    })));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchPaymentMethods}
          className="mt-2 text-green-600 hover:text-green-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Payment Methods</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus size={16} />
            Add Payment Method
          </button>
        )}
      </div>

      {showAddForm && (
        <Elements stripe={stripe}>
          <AddPaymentMethodForm
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddForm(false)}
          />
        </Elements>
      )}

      <div className="space-y-3">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No payment methods added yet</p>
            <p className="text-sm">Add a payment method to start booking spaces</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-3">
              Click any card to set it as your default payment method
            </div>
            {paymentMethods.map((paymentMethod) => (
              <PaymentMethodCard
                key={paymentMethod.id}
                paymentMethod={paymentMethod}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
                isDefault={paymentMethod.is_default}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
