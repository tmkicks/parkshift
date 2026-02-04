import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { profileService } from '../../lib/database';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const profile = await profileService.getProfile(supabase, user.id);
      res.status(200).json(profile);
    } else if (req.method === 'PUT') {
      const updates = req.body;
      const profile = await profileService.updateProfile(supabase, user.id, updates);
      res.status(200).json(profile);
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Profile API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
