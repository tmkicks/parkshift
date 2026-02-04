import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { subDays, format } from 'date-fns';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const { type = 'renter', range = '30' } = req.query;
      const days = parseInt(range);
      const startDate = subDays(new Date(), days);

      let analytics = {
        bookings: [],
        revenue: [],
        spaces: [],
        summary: {}
      };

      if (type === 'renter') {
        // Renter analytics
        const { data: bookings } = await supabase
          .from('bookings')
          .select(`
            *,
            space:parking_spaces(title, address, owner_id)
          `)
          .eq('renter_id', user.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });

        analytics.bookings = bookings || [];

        // Calculate summary stats
        const totalBookings = bookings?.length || 0;
        const totalSpent = bookings?.reduce((sum, b) => sum + parseFloat(b.total_amount), 0) || 0;
        const totalHours = bookings?.reduce((sum, b) => {
          const hours = Math.ceil((new Date(b.end_datetime) - new Date(b.start_datetime)) / (1000 * 60 * 60));
          return sum + hours;
        }, 0) || 0;

        const uniqueLocations = new Set(bookings?.map(b => b.space?.address)).size;

        // Calculate changes from previous period
        const previousPeriodStart = subDays(startDate, days);
        const { data: previousBookings } = await supabase
          .from('bookings')
          .select('total_amount')
          .eq('renter_id', user.id)
          .gte('created_at', previousPeriodStart.toISOString())
          .lt('created_at', startDate.toISOString());

        const previousTotal = previousBookings?.reduce((sum, b) => sum + parseFloat(b.total_amount), 0) || 0;
        const spentChange = previousTotal > 0 ? ((totalSpent - previousTotal) / previousTotal * 100) : 0;

        analytics.summary = {
          totalBookings,
          totalSpent: totalSpent.toFixed(2),
          totalHours,
          favoriteLocations: uniqueLocations,
          spentChange: Math.round(spentChange),
          bookingsChange: Math.round(((totalBookings - (previousBookings?.length || 0)) / Math.max(previousBookings?.length || 1, 1)) * 100)
        };

      } else {
        // Owner analytics
        const { data: spaces } = await supabase
          .from('parking_spaces')
          .select(`
            *,
            bookings(
              id,
              total_amount,
              start_datetime,
              end_datetime,
              status,
              created_at
            ),
            reviews(rating)
          `)
          .eq('owner_id', user.id);

        analytics.spaces = spaces || [];

        // Filter bookings for the date range
        const allBookings = spaces?.flatMap(space => 
          space.bookings?.filter(booking => 
            new Date(booking.created_at) >= startDate
          ) || []
        ) || [];

        analytics.bookings = allBookings;

        // Calculate summary stats
        const totalRevenue = allBookings.reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
        const activeListings = spaces?.filter(s => s.is_active).length || 0;
        
        // Calculate occupancy rate
        const totalSpaceHours = spaces?.reduce((sum, space) => {
          const spaceBookings = space.bookings?.filter(b => new Date(b.created_at) >= startDate) || [];
          const bookedHours = spaceBookings.reduce((hours, booking) => {
            return hours + Math.ceil((new Date(booking.end_datetime) - new Date(booking.start_datetime)) / (1000 * 60 * 60));
          }, 0);
          return sum + bookedHours;
        }, 0) || 0;

        const totalAvailableHours = days * 24 * activeListings;
        const occupancyRate = totalAvailableHours > 0 ? (totalSpaceHours / totalAvailableHours * 100) : 0;

        // Calculate average rating
        const allReviews = spaces?.flatMap(space => space.reviews || []) || [];
        const avgRating = allReviews.length > 0 ? 
          allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length : 0;

        analytics.summary = {
          totalRevenue: totalRevenue.toFixed(2),
          activeListings,
          occupancyRate: Math.round(occupancyRate),
          avgRating,
          revenueChange: 0, // Would need previous period calculation
          listingsChange: 0,
          occupancyChange: 0,
          ratingChange: 0
        };
      }

      return res.status(200).json(analytics);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
