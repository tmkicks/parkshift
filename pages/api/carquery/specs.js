export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { make, model, year } = req.query;
  
  if (!make || !model || !year) {
    return res.status(400).json({ error: 'Make, model, and year parameters are required' });
  }

  try {
    const response = await fetch(
      `https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`
    );
    const text = await response.text();
    
    // CarQuery returns JSONP, so we need to extract the JSON
    const jsonMatch = text.match(/\?\((.*)\);?$/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }
    
    const data = JSON.parse(jsonMatch[1]);
    return res.status(200).json(data);
  } catch (error) {
    console.error('CarQuery specs API error:', error);
    return res.status(500).json({ error: 'Failed to fetch vehicle specifications' });
  }
}
