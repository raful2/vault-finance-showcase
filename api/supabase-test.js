export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, key } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!url || !key) {
      return res.status(400).json({ error: 'Supabase URL and API Key are required' });
    }

    const testEndpoint = `${url.replace(/\/+$/, '')}/rest/v1/`;
    const response = await fetch(testEndpoint, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    return res.status(200).json({
      connected: response.status < 500,
      status: response.status,
      message: response.status < 500 ? 'Successfully connected to Supabase endpoint!' : `Supabase returned status ${response.status}`
    });
  } catch (err) {
    return res.status(200).json({
      connected: false,
      error: err.message,
      message: 'Could not connect to Supabase URL.'
    });
  }
}
