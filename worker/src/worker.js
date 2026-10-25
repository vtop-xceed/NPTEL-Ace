const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const clean = (v, max = 800) => String(v ?? '').trim().slice(0, max);

const bump = (db, key, by = 1) =>
  db.prepare('INSERT INTO stats (key, val) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET val = val + ?')
    .bind(key, by, by).run();

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const { pathname, searchParams } = new URL(request.url);

    const isAdmin = env.ADMIN_KEY && searchParams.get('admin') === env.ADMIN_KEY;

    if (pathname === '/fb') return handleFeedback(request, env, searchParams, isAdmin);
    if (pathname === '/track') return handleTrack(request, env);
    if (pathname === '/stats' && isAdmin) return handleStats(env);

    return json({ error: 'not found' }, 404);
  },
};

async function handleTrack(request, env) {
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  let f;
  try {
    f = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  if (f.type === 'visit') {
    await bump(env.DB, 'visits');
    if (f.new) await bump(env.DB, 'sessions');
    return json({ ok: true });
  }

  if (f.type === 'course') {
    await bump(env.DB, 'course:' + (clean(f.course, 20).toLowerCase() || 'general'));
    return json({ ok: true });
  }

  if (f.type === 'time') {
    const seconds = Math.max(0, Math.min(600, Math.floor(Number(f.seconds) || 0)));
    await bump(env.DB, 'time_seconds', seconds);
    return json({ ok: true });
  }

  return json({ error: 'unknown type' }, 400);
}

async function handleStats(env) {
  const { results } = await env.DB.prepare('SELECT key, val FROM stats').all();
  const map = Object.fromEntries(results.map(r => [r.key, r.val]));
  const courses = Object.entries(map)
    .filter(([k]) => k.startsWith('course:'))
    .map(([k, v]) => ({ course: k.slice(7), picks: v }))
    .sort((a, b) => b.picks - a.picks);
  return json({
    visits: map.visits || 0,
    sessions: map.sessions || 0,
    minutesOnSite: Math.round(((map.time_seconds || 0) / 60) * 10) / 10,
    avgMinutesPerSession: map.sessions
      ? Math.round(((map.time_seconds || 0) / map.sessions / 60) * 10) / 10
      : 0,
    topCourses: courses,
  });
}

async function handleFeedback(request, env, searchParams, isAdmin) {
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
    if (!isAdmin) return json({ error: 'unauthorized' }, 401);
    const { results } = await env.DB.prepare(
      'SELECT id, name, course, rating, message, page, created_at FROM feedback ORDER BY id DESC LIMIT 200'
    ).all();
    return json({ count: results.length, feedback: results });
  }

  return json({ error: 'method not allowed' }, 405);
}
