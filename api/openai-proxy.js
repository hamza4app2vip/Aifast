// Vercel/Node serverless function: OpenAI proxy
// Uses environment variable OPENAI_API_KEY (set in hosting secrets)

export default async function handler(req, res) {
  try {
    const { method } = req;
    // Support subpaths: /api/openai-proxy/v1/...
    const url = new URL(req.url, `http://${req.headers.host}`);
    const prefix = '/api/openai-proxy';
    const rest = url.pathname.startsWith(prefix) ? url.pathname.substring(prefix.length) : '';
    const target = `https://api.openai.com${rest || '/v1'}` + (url.search || '');

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (k.toLowerCase() === 'host') continue;
      if (k.toLowerCase() === 'content-length') continue;
      if (k.toLowerCase() === 'authorization') continue; // override
      headers.set(k, Array.isArray(v) ? v.join(', ') : v);
    }
    headers.set('Authorization', `Bearer ${process.env.OPENAI_API_KEY || ''}`);

    const body = ['GET', 'HEAD'].includes(method) ? undefined : Buffer.from(await getRawBody(req));
    const resp = await fetch(target, { method, headers, body });
    res.status(resp.status);
    // copy headers
    resp.headers.forEach((v, k) => {
      if (k.toLowerCase() === 'content-length') return;
      res.setHeader(k, v);
    });
    res.setHeader('Cache-Control', 'no-store');
    const buf = Buffer.from(await resp.arrayBuffer());
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: { message: String(err) } });
  }
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

