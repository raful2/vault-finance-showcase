// In-memory / localStorage bridge for Vercel serverless demo mode
let memoryState = null;

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    if (memoryState) {
      return res.status(200).json(memoryState);
    }
    return res.status(200).json({ message: 'Ready for client sync' });
  }

  if (req.method === 'POST') {
    try {
      memoryState = req.body;
      return res.status(200).json({ success: true, savedAt: new Date().toISOString() });
    } catch (e) {
      return res.status(400).json({ error: 'Invalid state' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
