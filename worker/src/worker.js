const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const clean = (v, max = 800) => String(v ?? '').trim().slice(0, max);

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const { pathname, searchParams } = new URL(request.url);
    if (pathname !== '/fb') return json({ error: 'not found' }, 404);

    if (request.method === 'POST') {
      let f;
      try {
        f = await request.json();
      } catch {
        return json({ error: 'invalid json' }, 400);
      }
      const message = clean(f.message);
      if (!message) return json({ error: 'message required' }, 400);
      await env.DB.prepare(
        'INSERT INTO feedback (name, course, rating, message, page) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(
          clean(f.name, 100) || 'Anonymous',
          clean(f.course, 50) || 'general',
          Number(f.rating) || 5,
          message,
          clean(f.page, 300)
        )
        .run();
      return json({ ok: true });
    }

    if (request.method === 'GET') {
      if (!env.ADMIN_KEY || searchParams.get('admin') !== env.ADMIN_KEY) {
        return json({ error: 'unauthorized' }, 401);
      }
      const { results } = await env.DB.prepare(
        'SELECT id, name, course, rating, message, page, created_at FROM feedback ORDER BY id DESC LIMIT 200'
      ).all();
      return json({ count: results.length, feedback: results });
    }

    return json({ error: 'method not allowed' }, 405);
  },
};
