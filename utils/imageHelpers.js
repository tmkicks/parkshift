// Helper function to get the main image from a listing
export const getMainImage = (listing) => {
  if (listing.images && listing.images.length > 0) {
    return listing.images[0];
  }
  return null; // or a default placeholder image
};

// Helper function to get image URL safely
export const getImageUrl = (listing, defaultImage = '/placeholder-parking.jpg') => {
  const mainImage = getMainImage(listing);
  return mainImage || defaultImage;
};