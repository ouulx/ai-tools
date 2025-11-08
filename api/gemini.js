// api/gemini.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });

    const body = await readBody(req);
    // terima langsung payload dari client (contents + systemInstruction)
    const payload = {
      ...body,
    };

    // NOTE: ganti model kalau perlu. Pastikan model tersedia di project key-mu.
    const model = "gemini-1.5-flash";
    const endpoint =
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;


    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data.error?.message || 'Upstream error' });
    }

    // Normalisasi sedikit: ambil teks utama kalau ada
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ ...data, text });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}
