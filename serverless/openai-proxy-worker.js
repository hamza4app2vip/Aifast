// Cloudflare Worker: OpenAI proxy (secure)
// - Set the secret in Cloudflare as environment variable OPENAI_API_KEY
// - Deploy, then set window.OPENAI_PROXY_URL on the frontend to your worker URL
// - This worker overwrites Authorization to protect the key

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      // Map to OpenAI API
      const target = new URL(`https://api.openai.com${url.pathname.replace(/^\/v1?/, '/v1')}${url.search}`);

      // Clone request and override headers
      const headers = new Headers(request.headers);
      headers.set('Authorization', `Bearer ${env.OPENAI_API_KEY}`);
      // Ensure JSON default for common endpoints; keep content-type if multipart
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      const init = {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      };

      const resp = await fetch(target.toString(), init);
      // Mirror response (no caching)
      const respHeaders = new Headers(resp.headers);
      respHeaders.set('Cache-Control', 'no-store');
      return new Response(resp.body, { status: resp.status, headers: respHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: { message: String(err) } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }
  },
};

