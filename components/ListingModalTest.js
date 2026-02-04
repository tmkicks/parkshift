import { useState } from 'react';
import AddListingModal from './AddListingModal';

export default function ListingModalTest() {
  const [showModal, setShowModal] = useState(false);
  const [listings, setListings] = useState([]);
  const [refreshCount, setRefreshCount] = useState(0);

  const handleSave = (savedListing) => {
    console.log('=== TEST: handleSave called ===');
    console.log('Saved listing:', savedListing);
    
    // Add to listings array
    setListings(prev => {
      const updated = [...prev, savedListing];
      console.log('Updated listings array:', updated);
      return updated;
    });
  };

  const handleRefresh = () => {
    console.log('=== TEST: handleRefresh called ===');
    setRefreshCount(prev => prev + 1);
    console.log('Refresh count incremented to:', refreshCount + 1);
  };

  const handleClose = () => {
    console.log('=== TEST: handleClose called ===');
    setShowModal(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Listing Modal Test</h1>
      
      <div className="mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Open Add Listing Modal
        </button>
      </div>

      <div className="mb-4">
        <p>Listings count: {listings.length}</p>
        <p>Refresh count: {refreshCount}</p>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold">Current Listings:</h3>
        {listings.map((listing, index) => (
          <div key={index} className="border p-2 mb-2 rounded">
            <p><strong>Title:</strong> {listing.title}</p>
            <p><strong>Address:</strong> {listing.address}</p>
            <p><strong>ID:</strong> {listing.id}</p>
          </div>
        ))}
      </div>

      {showModal && (
        <AddListingModal
          onClose={handleClose}
          onSave={handleSave}
          onRefresh={handleRefresh}
          userId="test-user-id"
        />
      )}
    </div>
  );
}