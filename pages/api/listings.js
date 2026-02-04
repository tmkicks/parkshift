import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { listingService } from '../../lib/database';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });

  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (req.method) {
      case 'GET':
        // Get user's listings or public listings
        const { public: isPublic, ...filters } = req.query;
        
        if (isPublic === 'true') {
          const listings = await listingService.getPublicListings(supabase, filters);
          return res.status(200).json({ listings });
        } else {
          const listings = await listingService.getUserListings(supabase, user.id);
          return res.status(200).json({ listings });
        }

      case 'POST':
        // Create new listing
        const listingData = req.body;
        const newListing = await listingService.createListing(supabase, user.id, listingData);
        return res.status(201).json({ listing: newListing });

      case 'PUT':
        // Update existing listing
        const { id: listingId, ...updateData } = req.body;
        if (!listingId) {
          return res.status(400).json({ error: 'Listing ID is required' });
        }
        
        const updatedListing = await listingService.updateListing(supabase, listingId, user.id, updateData);
        return res.status(200).json({ listing: updatedListing });

      case 'DELETE':
        // Delete listing
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'Listing ID is required' });
        }
        
        await listingService.deleteListing(supabase, id, user.id);
        return res.status(200).json({ message: 'Listing deleted successfully' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Listings API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
