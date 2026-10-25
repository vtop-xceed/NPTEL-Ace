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
    if (pathname === '/admin' && isAdmin) {
      return new Response(adminHtml(), { headers: { ...CORS, 'Content-Type': 'text/html; charset=utf-8' } });
    }

    return json({ error: 'not found' }, 404);
  },
};

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function adminHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NPTEL-Ace Admin</title>
<style>
  :root { --bg:#0f1420; --card:#1a2233; --text:#e8eefc; --mut:#8fa0c0; --accent:#4f83ff; --line:#2a3550; }
  * { box-sizing:border-box; margin:0; }
  body { background:var(--bg); color:var(--text); font:15px/1.5 system-ui, sans-serif; padding:24px; max-width:900px; margin:auto; }
  h1 { font-size:1.3rem; margin-bottom:4px; }
  .mut { color:var(--mut); font-size:.85rem; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin:20px 0; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:18px; }
  .card .n { font-size:1.7rem; font-weight:700; color:var(--accent); }
  .card .l { color:var(--mut); font-size:.8rem; margin-top:2px; }
  table { width:100%; border-collapse:collapse; background:var(--card); border:1px solid var(--line); border-radius:14px; overflow:hidden; }
  th, td { text-align:left; padding:10px 14px; border-top:1px solid var(--line); font-size:.9rem; }
  th { color:var(--mut); font-size:.75rem; text-transform:uppercase; letter-spacing:.5px; border-top:none; }
  .fb { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:12px 16px; margin-top:10px; }
  .fb .top { display:flex; justify-content:space-between; font-size:.8rem; color:var(--mut); }
  button { background:var(--accent); color:#fff; border:none; border-radius:8px; padding:8px 16px; cursor:pointer; }
  section { margin-top:28px; }
  .bar { height:8px; background:var(--accent); border-radius:4px; }
</style>
</head>
<body>
<h1>NPTEL-Ace Admin</h1>
<p class="mut">Live numbers from the deployed Worker. <button onclick="load()">Refresh</button> <span class="mut">auto-refreshes every 30s</span></p>
<section><div class="grid" id="cards"></div></section>
<section><h2>Course picks</h2><div id="courses"></div></section>
<section><h2>Feedback</h2><div id="fb"></div></section>
<script>
const KEY = new URLSearchParams(location.search).get('admin') || '';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stars = n => '★'.repeat(Math.min(5, n)) + '☆'.repeat(Math.max(0, 5 - n));

async function load() {
  try {
    const s = await fetch('/stats?admin=' + KEY).then(r => r.json());
    document.getElementById('cards').innerHTML = [
      ['Visits', s.visits],
      ['Sessions', s.sessions],
      ['Minutes on site', s.minutesOnSite],
      ['Avg min / session', s.avgMinutesPerSession],
    ].map(([l, n]) => '<div class="card"><div class="n">' + esc(n) + '</div><div class="l">' + l + '</div></div>').join('');
    const c = s.topCourses || [];
    const max = c.length ? c[0].picks : 1;
    document.getElementById('courses').innerHTML = c.length
      ? '<table><tr><th>Course</th><th>Shares</th><th>Picks</th></tr>' + c.map(x =>
          '<tr><td>' + esc(x.course) + '</td><td style="width:45%"><div class="bar" style="width:' + Math.round(x.picks / max * 100) + '%"></div></td><td><b>' + x.picks + '</b></td></tr>').join('') + '</table>'
      : '<p class="mut">No picks yet.</p>';
    const f = await fetch('/fb?admin=' + KEY).then(r => r.json());
    document.getElementById('fb').innerHTML = (f.feedback || []).map(x =>
      '<div class="fb"><div class="top"><b>' + esc(x.name) + '</b><span>' + stars(x.rating) + ' · ' + esc(x.created_at) + '</span></div>' +
      '<div style="margin:6px 0">' + esc(x.message) + '</div>' +
      '<div class="mut">' + esc(x.course) + ' · ' + esc(x.page) + '</div></div>').join('')
      || '<p class="mut">No feedback yet.</p>';
  } catch (e) {
    document.getElementById('cards').innerHTML = '<div class="card">Failed to load: ' + esc(e.message) + '</div>';
  }
}
load();
setInterval(load, 30000);
</script>
</body>
</html>`;
}

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
