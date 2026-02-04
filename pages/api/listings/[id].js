import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { listingService } from '../../../lib/database';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });
  const { id } = req.query;

  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'Listing ID is required' });
      }
      
      await listingService.deleteListing(supabase, id, user.id);
      return res.status(200).json({ message: 'Listing deleted successfully' });
    }

    if (req.method === 'GET') {
      // Get single listing
      const listing = await listingService.getListingById(supabase, id);
      return res.status(200).json(listing);
    }

    if (req.method === 'PUT') {
      // Update listing
      const updateData = req.body;
      const updatedListing = await listingService.updateListing(supabase, id, user.id, updateData);
      return res.status(200).json({ listing: updatedListing });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Listing API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}