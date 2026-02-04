import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { vehicleService } from '../../lib/database';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const vehicles = await vehicleService.getUserVehicles(supabase, user.id);
      res.status(200).json(vehicles);
    } else if (req.method === 'POST') {
      const vehicleData = { ...req.body, user_id: user.id };
      const vehicle = await vehicleService.addVehicle(supabase, vehicleData);
      res.status(201).json(vehicle);
    } else if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      const vehicle = await vehicleService.updateVehicle(supabase, id, updates);
      res.status(200).json(vehicle);
    } else if (req.method === 'DELETE') {
      const { id } = req.body;
      await vehicleService.deleteVehicle(supabase, id);
      res.status(200).json({ success: true });
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Vehicles API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
