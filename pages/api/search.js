import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { location, radius, dates, vehicle, filters } = req.body;

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    // Build the search query
    let query = supabase
      .from('parking_spaces')
      .select(`
        *,
        owner:profiles!parking_spaces_owner_id_fkey(first_name, last_name, avatar_url, phone),
        reviews:reviews!reviews_space_id_fkey(rating)
      `)
      .eq('is_active', true)
      .eq('is_available', true);

    // Filter by location using PostGIS
    if (radius) {
      query = query.filter('location', 'st_dwithin', `POINT(${location.longitude} ${location.latitude})::geography,${radius * 1000}`);
    }

    // Filter by vehicle dimensions if provided
    if (vehicle) {
      if (vehicle.length_cm) {
        query = query.gte('length_cm', vehicle.length_cm);
      }
      if (vehicle.width_cm) {
        query = query.gte('width_cm', vehicle.width_cm);
      }
      if (vehicle.height_cm) {
        query = query.gte('height_cm', vehicle.height_cm);
      }
      if (vehicle.weight_kg) {
        query = query.gte('max_weight_kg', vehicle.weight_kg);
      }
    }

    // Filter by price range
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const priceField = dates.isHourly ? 'hourly_price' : 'daily_price';
      if (filters.priceMin !== undefined) {
        query = query.gte(priceField, filters.priceMin);
      }
      if (filters.priceMax !== undefined) {
        query = query.lte(priceField, filters.priceMax);
      }
    }

    // Execute the query
    const { data: spaces, error } = await query;

    if (error) throw error;

    // Filter by amenities (done in JavaScript since amenities is JSONB)
    let filteredSpaces = spaces || [];
    
    if (filters.evCharging || filters.covered || filters.security || filters.accessibility) {
      filteredSpaces = filteredSpaces.filter(space => {
        const amenities = space.amenities || {};
        return (
          (!filters.evCharging || amenities.evCharging) &&
          (!filters.covered || amenities.covered) &&
          (!filters.security || amenities.security) &&
          (!filters.accessibility || amenities.accessibility)
        );
      });
    }

    // Check availability for the requested dates
    if (dates && dates.startDate && dates.endDate) {
      const startDate = new Date(dates.startDate);
      const endDate = new Date(dates.endDate);

      // Get existing bookings that conflict with requested dates
      const { data: conflictingBookings } = await supabase
        .from('bookings')
        .select('space_id')
        .in('space_id', filteredSpaces.map(s => s.id))
        .neq('status', 'cancelled')
        .or(`start_datetime.lte.${endDate.toISOString()},end_datetime.gte.${startDate.toISOString()}`);

      const conflictingSpaceIds = new Set(conflictingBookings?.map(b => b.space_id) || []);
      filteredSpaces = filteredSpaces.filter(space => !conflictingSpaceIds.has(space.id));
    }

    // Calculate distance and add review statistics
    const enhancedSpaces = filteredSpaces.map(space => {
      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        space.latitude,
        space.longitude
      );

      // Calculate review statistics
      const reviews = space.reviews || [];
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : null;

      return {
        ...space,
        distance,
        average_rating: averageRating,
        review_count: reviews.length
      };
    });

    // Sort by distance by default
    enhancedSpaces.sort((a, b) => a.distance - b.distance);

    return res.status(200).json(enhancedSpaces);

  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
