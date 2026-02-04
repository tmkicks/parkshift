export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { make } = req.query;
  
  if (!make) {
    return res.status(400).json({ error: 'Make parameter is required' });
  }

  try {
    const response = await fetch(`https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getModels&make=${encodeURIComponent(make)}`);
    const text = await response.text();
    
    // CarQuery returns JSONP, so we need to extract the JSON
    const jsonMatch = text.match(/\?\((.*)\);?$/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }
    
    const data = JSON.parse(jsonMatch[1]);
    return res.status(200).json(data);
  } catch (error) {
    console.error('CarQuery models API error:', error);
    return res.status(500).json({ error: 'Failed to fetch vehicle models' });
  }
}
