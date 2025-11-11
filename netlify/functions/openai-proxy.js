// Netlify function: OpenAI proxy
// Set environment variable OPENAI_API_KEY in Netlify site settings

exports.handler = async function (event, context) {
  try {
    const method = event.httpMethod || 'GET';
    const prefix = '/.netlify/functions/openai-proxy';
    const restPath = (event.path || '').startsWith(prefix) ? (event.path || '').substring(prefix.length) : '';
    const target = `https://api.openai.com${restPath || '/v1'}${event.rawQuery ? '?' + event.rawQuery : ''}`;

    const headers = new Headers();
    for (const [k, v] of Object.entries(event.headers || {})) {
      if (k.toLowerCase() === 'host') continue;
      if (k.toLowerCase() === 'content-length') continue;
      if (k.toLowerCase() === 'authorization') continue; // override
      headers.set(k, v);
    }
    headers.set('Authorization', `Bearer ${process.env.OPENAI_API_KEY || ''}`);

    const body = ['GET', 'HEAD'].includes(method) ? undefined : event.isBase64Encoded ? Buffer.from(event.body || '', 'base64') : event.body;
    const resp = await fetch(target, { method, headers, body });
    const arrayBuf = await resp.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const responseHeaders = {};
    resp.headers.forEach((v, k) => { if (k.toLowerCase() !== 'content-length') responseHeaders[k] = v; });
    responseHeaders['Cache-Control'] = 'no-store';
    return {
      statusCode: resp.status,
      headers: responseHeaders,
      body: buf.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: { message: String(err) } }) };
  }
};

