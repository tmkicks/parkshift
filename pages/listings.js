import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import Layout from '../components/Layout';
import ListingCard from '../components/ListingCard';
import AddListingModal from '../components/AddListingModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ListingsPage() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingListing, setEditingListing] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingListingId, setDeletingListingId] = useState(null);
  const [deletingListing, setDeletingListing] = useState(null);
  const router = useRouter();
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);
      loadListings();
    };

    getUser();
  }, [router, supabase.auth]);

  const loadListings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user-specific listings (not public listings)
      const response = await fetch('/api/listings');
      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        if (data.listings && Array.isArray(data.listings)) {
          // Sort listings: active first, then inactive
          const sortedListings = data.listings.sort((a, b) => {
            if (a.is_active && !b.is_active) return -1;
            if (!a.is_active && b.is_active) return 1;
            return 0;
          });
          setListings(sortedListings);
        } else if (Array.isArray(data)) {
          // Sort listings: active first, then inactive
          const sortedListings = data.sort((a, b) => {
            if (a.is_active && !b.is_active) return -1;
            if (!a.is_active && b.is_active) return 1;
            return 0;
          });
          setListings(sortedListings);
        } else {
          setListings([]);
        }
      } else {
        console.error('API response not ok:', response.status);
        setListings([]);
      }
    } catch (error) {
      toast.error('Failed to load listings');
      console.error('LoadListings error:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  // Add refresh function to reload listings after creation
  const refreshListings = () => {
    setLoading(true);
    loadListings();
  };

  const handleToggleStatus = async (spaceId, isActive) => {
    try {
      const response = await fetch(`/api/listings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: spaceId,
          is_active: isActive 
        })
      });

      if (response.ok) {
        await loadListings();
        toast.success(`Listing ${isActive ? 'activated' : 'paused'}`);
      } else {
        const errorData = await response.json();
        console.error('Toggle status error:', errorData);
        throw new Error(errorData.error || 'Failed to update listing');
      }
    } catch (error) {
      toast.error('Failed to update listing');
      console.error('handleToggleStatus error:', error);
    }
  };

  const handleDelete = async (spaceId) => {
    // Find the listing being deleted for display in modal
    const listingToDelete = listings.find(listing => listing.id === spaceId);
    setDeletingListing(listingToDelete);
    setDeletingListingId(spaceId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/listings?id=${deletingListingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        await loadListings();
        toast.success('Listing deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingListingId(null);
        setDeletingListing(null);
      } else {
        const errorData = await response.json();
        console.error('Delete error:', errorData);
        throw new Error(errorData.error || 'Failed to delete listing');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete listing');
      console.error('confirmDelete error:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingListingId(null);
    setDeletingListing(null);
  };

  const handleEdit = (listing) => {
    setEditingListing(listing);
    setShowAddModal(true);
  };

  if (!user) {
    return <LoadingSpinner message="Loading listings..." size="xlarge" className="min-h-screen" />;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Plus size={20} />
            Add Listing
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading your listings..." size="large" />
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Plus size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
            <p className="text-gray-500 mb-6">Create your first parking space listing to start earning money.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Create Your First Listing
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.isArray(listings) && listings.map((listing) => (
              <ListingCard 
                key={listing.id} 
                listing={listing}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}

        {/* Add Listing Modal with proper callbacks */}
        {showAddModal && (
          <AddListingModal
            onClose={() => {
              setShowAddModal(false);
              setEditingListing(null); // Clear editing state when closing
            }}
            onSave={(savedListing) => {
              
              if (editingListing) {
                // Update existing listing in state
                setListings(prev => prev.map(listing => 
                  listing.id === savedListing.id ? savedListing : listing
                ));
              } else {
                // Add new listing to state
                setListings(prev => [savedListing, ...prev]);
              }
              
              // Close modal after successful save
              setShowAddModal(false);
              setEditingListing(null);
            }}
            onRefresh={() => {
              refreshListings();
            }}
            userId={user?.id}
            editingListing={editingListing} // Pass the listing being edited
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && deletingListing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Delete Listing
                </h3>
                
                <div className="text-center mb-4">
                  <p className="text-gray-600 mb-3">
                    Are you sure you want to delete this listing?
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="font-medium text-gray-900">{deletingListing.title}</p>
                    <p className="text-sm text-gray-600">{deletingListing.address}</p>
                  </div>
                  
                  <p className="text-sm text-red-600 font-medium">
                    This action cannot be undone and will permanently remove your parking space from the platform.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Delete Listing
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
