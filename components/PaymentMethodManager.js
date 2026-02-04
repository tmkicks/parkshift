import { useState, useEffect } from 'react';
import { createClientComponentClient, createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { CreditCard, Plus, Edit, Trash2, Star, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const AddPaymentMethodForm = ({ onSuccess, onCancel, userId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const supabase = createPagesBrowserClient();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Save payment method to backend
      const response = await fetch('/api/payments/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id,
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save payment method');
      }

      toast.success('Payment method added successfully');
      onSuccess();
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error(error.message || 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Add Payment Method
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
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
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Lock size={12} />
            <span>Your payment information is encrypted and secure</span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function PaymentMethodManager({ userId }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    if (userId) {
      loadPaymentMethods();
    }
  }, [userId]);

  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      const response = await fetch(`/api/payments/methods?id=${methodId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }

      setPaymentMethods(prev => prev.filter(pm => pm.id !== methodId));
      toast.success('Payment method deleted successfully');
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  const handleSetDefault = async (methodId) => {
    try {
      const response = await fetch('/api/payments/methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: methodId,
          is_default: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to set default payment method');
      }

      // Update local state
      setPaymentMethods(prev => prev.map(pm => ({
        ...pm,
        is_default: pm.id === methodId
      })));

      toast.success('Default payment method updated');
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast.error('Failed to update default payment method');
    }
  };

  const getCardBrandIcon = (brand) => {
    const brandIcons = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳'
    };
    return brandIcons[brand?.toLowerCase()] || '💳';
  };

  const getCardBrandColor = (brand) => {
    const brandColors = {
      visa: 'from-blue-500 to-blue-600',
      mastercard: 'from-red-500 to-orange-500',
      amex: 'from-green-500 to-teal-500',
      discover: 'from-orange-500 to-amber-500'
    };
    return brandColors[brand?.toLowerCase()] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-24 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payment Methods</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your saved payment cards</p>
        </div>
        
        {paymentMethods.length < 5 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={16} />
            Add Card
          </button>
        )}
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <div className="text-center py-12">
          <img 
            src="/logos/logo_dark.png" 
            alt="ParkShift Logo" 
            className="w-16 h-16 mx-auto mb-4 opacity-40"
          />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No payment methods added yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add a payment method to start booking parking spaces
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={16} />
            Add Your First Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paymentMethods.map((method) => (
            <div key={method.id} className="relative">
              {/* Credit Card Design */}
              <div className={`bg-gradient-to-br ${getCardBrandColor(method.card_brand)} rounded-xl p-6 text-white shadow-lg`}>
                <div className="flex justify-between items-start mb-8">
                  <div className="text-2xl">
                    {getCardBrandIcon(method.card_brand)}
                  </div>
                  {method.is_default && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">
                      <Star size={12} className="fill-current" />
                      Default
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="text-lg font-mono tracking-wider">
                    •••• •••• •••• {method.card_last4}
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs opacity-75">EXPIRES</div>
                      <div className="font-mono">
                        {method.card_exp_month?.toString().padStart(2, '0')}/{method.card_exp_year?.toString().slice(-2)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold uppercase">
                      {method.card_brand}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeletePaymentMethod(method.id)}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>

                {!method.is_default && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add Card */}
          {paymentMethods.length < 5 && (
            <div
              onClick={() => setShowAddModal(true)}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors min-h-[200px]"
            >
              <Plus className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Add Another Card
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                You can add up to 5 payment methods
              </p>
            </div>
          )}
        </div>
      )}

      {/* Limit Notice */}
      {paymentMethods.length >= 5 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>Payment Method Limit Reached:</strong> You can add up to 5 payment methods. Delete a card to add a new one.
          </p>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Lock size={16} />
          <p className="text-sm">
            <strong>Secure:</strong> Your payment information is encrypted and processed securely by Stripe. We never store your full card details.
          </p>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddModal && (
        <Elements stripe={stripePromise}>
          <AddPaymentMethodForm
            onSuccess={() => {
              setShowAddModal(false);
              loadPaymentMethods();
            }}
            onCancel={() => setShowAddModal(false)}
            userId={userId}
          />
        </Elements>
      )}
    </div>
  );
}
