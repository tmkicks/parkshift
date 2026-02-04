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

      let csvData = '';
      let filename = '';

      if (type === 'renter') {
        const { data: bookings } = await supabase
          .from('bookings')
          .select(`
            id,
            total_amount,
            start_datetime,
            end_datetime,
            status,
            created_at,
            space:parking_spaces(title, address)
          `)
          .eq('renter_id', user.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });

        // CSV headers
        csvData = 'Booking ID,Space,Address,Date,Duration (hours),Amount,Status\n';
        
        // CSV rows
        bookings?.forEach(booking => {
          const duration = Math.ceil((new Date(booking.end_datetime) - new Date(booking.start_datetime)) / (1000 * 60 * 60));
          csvData += `${booking.id},${booking.space?.title || 'N/A'},"${booking.space?.address || 'N/A'}",${format(new Date(booking.created_at), 'yyyy-MM-dd')},${duration},€${booking.total_amount},${booking.status}\n`;
        });

        filename = `parkshift-renter-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;

      } else {
        // Owner analytics
        const { data: spaces } = await supabase
          .from('parking_spaces')
          .select(`
            id,
            title,
            hourly_price,
            daily_price,
            created_at,
            bookings(
              id,
              total_amount,
              start_datetime,
              end_datetime,
              status,
              created_at
            )
          `)
          .eq('owner_id', user.id);

        // CSV headers
        csvData = 'Space ID,Space Title,Hourly Rate,Daily Rate,Total Bookings,Total Revenue,Created Date\n';
        
        // CSV rows
        spaces?.forEach(space => {
          const recentBookings = space.bookings?.filter(b => new Date(b.created_at) >= startDate) || [];
          const totalRevenue = recentBookings.reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
          
          csvData += `${space.id},"${space.title}",€${space.hourly_price},€${space.daily_price},${recentBookings.length},€${totalRevenue.toFixed(2)},${format(new Date(space.created_at), 'yyyy-MM-dd')}\n`;
        });

        filename = `parkshift-owner-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csvData);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Export API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
