import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });
  const { id } = req.query;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify space ownership
    const { data: space } = await supabase
      .from('parking_spaces')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!space || space.owner_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'GET') {
      // Get availability for specific month
      const { month } = req.query; // Format: YYYY-MM
      
      if (!month) {
        return res.status(400).json({ error: 'Month parameter required' });
      }

      const monthStart = startOfMonth(parseISO(`${month}-01`));
      const monthEnd = endOfMonth(monthStart);

      const { data: slots } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('space_id', id)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      // Convert to calendar format
      const availability = {};
      const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

      allDays.forEach(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const daySlots = slots?.filter(slot => slot.date === dateKey) || [];
        
        // Build hour availability object
        const hours = {};
        for (let hour = 0; hour < 24; hour++) {
          const slot = daySlots.find(s => s.start_hour === hour);
          hours[hour] = slot ? slot.is_available : true; // Default to available
        }
        
        const hasAnyAvailable = Object.values(hours).some(Boolean);
        
        availability[dateKey] = {
          available: hasAnyAvailable,
          hours
        };
      });

      return res.status(200).json(availability);
    }

    if (req.method === 'POST') {
      // Save availability for specific month
      const { month, availability } = req.body;
      
      if (!month || !availability) {
        return res.status(400).json({ error: 'Month and availability data required' });
      }

      // Delete existing slots for the month
      const monthStart = startOfMonth(parseISO(`${month}-01`));
      const monthEnd = endOfMonth(monthStart);

      await supabase
        .from('availability_slots')
        .delete()
        .eq('space_id', id)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      // Create new slots
      const slotsToInsert = [];
      
      Object.entries(availability).forEach(([dateKey, dayData]) => {
        Object.entries(dayData.hours).forEach(([hour, isAvailable]) => {
          slotsToInsert.push({
            space_id: id,
            date: dateKey,
            start_hour: parseInt(hour),
            end_hour: parseInt(hour) + 1,
            is_available: isAvailable
          });
        });
      });

      if (slotsToInsert.length > 0) {
        const { error } = await supabase
          .from('availability_slots')
          .insert(slotsToInsert);

        if (error) throw error;
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Availability API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
