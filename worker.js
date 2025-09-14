// worker.js
// Cloudflare Worker backend for SimpleForum
// Требует:
// - D1 база (биндинг DATABASE)
// - Секрет JWT_SECRET (через wrangler secret put)

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api')) {
        return await handleApi(request, env);
      }
      return new Response('Not Found', { status: 404 });
    } catch (err) {
      return new Response(JSON.stringify({ message: err.message }), { status: 500 });
    }
  }
};

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '') || '/';
  const method = request.method.toUpperCase();

  // CORS preflight
  if (method === 'OPTIONS') {
    return cors(new Response(null, { status: 204 }));
  }

  if (path === '/auth/register' && method === 'POST') return register(request, env);
  if (path === '/auth/login' && method === 'POST') return login(request, env);
  if (path === '/auth/me' && method === 'GET') return meEndpoint(request, env);

  if (path === '/topics' && method === 'GET') return listTopics(request, env);
  if (path === '/topics' && method === 'POST') return createTopic(request, env);

  const matchTopic = path.match(/^\/topics\/(\d+)(\/posts)?$/);
  if (matchTopic) {
    const id = matchTopic[1];
    const postsPart = !!matchTopic[2];
    if (!postsPart && method === 'GET') return getTopic(request, env, id);
    if (postsPart && method === 'POST') return createPost(request, env, id);
  }

  return cors(json({ message: 'Not found' }, 404));
}

/* ---------- Utilities ---------- */

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

function cors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

async function parseBody(request) {
  try {
    return await request.json();
  } catch (e) {
    return {};
  }
}

async function hashPassword(password, saltHex = null) {
  const enc = new TextEncoder();
  const pwKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  if (!saltHex) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    saltHex = bufferToHex(salt);
  }
  const salt = hexToBuffer(saltHex);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    pwKey,
    256
  );
  const hashHex = bufferToHex(new Uint8Array(derived));
  return { salt: saltHex, hash: hashHex };
}

function bufferToHex(buf) {
  return Array.from(buf)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

async function signJWT(payload, env) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigb64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${sigb64}`;
}

async function verifyJWT(token, env) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const data = `${h}.${p}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(env.JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expectedSig = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(data)
    );
    const expSig = btoa(String.fromCharCode(...new Uint8Array(expectedSig)));
    if (expSig !== s) return null;
    const payload = JSON.parse(atob(p));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

/* ---------- DB helpers ---------- */

async function runDB(env, sql, binds = []) {
  const res = await env.DATABASE.prepare(sql).bind(...binds).all();
  return res;
}
async function execDB(env, sql, binds = []) {
  const res = await env.DATABASE.prepare(sql).bind(...binds).run();
  return res;
}

/* ---------- Endpoints ---------- */

async function register(request, env) {
  const body = await parseBody(request);
  const username = (body.username || '').trim();
  const password = body.password || '';
  if (!username || !password)
    return cors(json({ message: 'username and password required' }, 400));

  const exists = await runDB(
    env,
    'SELECT id FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  if (exists.results && exists.results.length)
    return cors(json({ message: 'username taken' }, 400));

  const { salt, hash } = await hashPassword(password);
  await execDB(
    env,
    'INSERT INTO users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)',
    [username, hash, salt, Date.now()]
  );
  return cors(json({ message: 'ok' }, 201));
}

async function login(request, env) {
  const body = await parseBody(request);
  const username = (body.username || '').trim();
  const password = body.password || '';
  if (!username || !password)
    return cors(json({ message: 'username and password required' }, 400));

  const r = await runDB(
    env,
    'SELECT id, password_hash, salt FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  if (!r.results || r.results.length === 0)
    return cors(json({ message: 'invalid credentials' }, 401));
  const u = r.results[0];
  const { hash } = await hashPassword(password, u.salt);
  if (hash !== u.password_hash)
    return cors(json({ message: 'invalid credentials' }, 401));

  const payload = { uid: u.id, username, exp: Date.now() + 7 * 24 * 3600 * 1000 };
  const token = await signJWT(payload, env);
  return cors(json({ token }));
}

async function meEndpoint(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/);
  if (!m) return cors(json({ message: 'unauthenticated' }, 401));
  const token = m[1];
  const payload = await verifyJWT(token, env);
  if (!payload) return cors(json({ message: 'unauthenticated' }, 401));
  return cors(json({ user: { id: payload.uid, username: payload.username } }));
}

async function listTopics(request, env) {
  const res = await runDB(
    env,
    `SELECT t.id, t.title, t.created_at, u.username as author
     FROM topics t
     LEFT JOIN users u ON u.id = t.author_id
     ORDER BY t.created_at DESC
     LIMIT 100`
  );
  const topics = (res.results || []).map(r => ({
    id: r.id,
    title: r.title,
    created_at: r.created_at,
    author: r.author || 'Unknown'
  }));
  return cors(json({ topics }));
}

async function createTopic(request, env) {
  const payload = await authPayload(request, env);
  if (!payload) return cors(json({ message: 'unauthenticated' }, 401));

  const body = await parseBody(request);
  const title = (body.title || '').trim();
  if (!title) return cors(json({ message: 'title required' }, 400));

  await execDB(
    env,
    'INSERT INTO topics (title, author_id, created_at) VALUES (?, ?, ?)',
    [title, payload.uid, Date.now()]
  );
  return cors(json({ message: 'ok' }, 201));
}

async function getTopic(request, env, id) {
  const r = await runDB(
    env,
    `SELECT t.id, t.title, t.created_at, u.username as author
     FROM topics t
     LEFT JOIN users u ON u.id = t.author_id
     WHERE t.id = ? LIMIT 1`,
    [id]
  );
  if (!r.results || r.results.length === 0)
    return cors(json({ message: 'not found' }, 404));
  const topic = r.results[0];

  const p = await runDB(
    env,
    `SELECT p.id, p.content, p.created_at, u.username as author
     FROM posts p
     LEFT JOIN users u ON u.id = p.author_id
     WHERE p.topic_id = ?
     ORDER BY p.created_at ASC`,
    [id]
  );
  const posts = (p.results || []).map(row => ({
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    author: row.author || 'Unknown'
  }));
  return cors(json({ topic, posts }));
}

async function createPost(request, env, topicId) {
  const payload = await authPayload(request, env);
  if (!payload) return cors(json({ message: 'unauthenticated' }, 401));

  const body = await parseBody(request);
  const content = (body.content || '').trim();
  if (!content) return cors(json({ message: 'content required' }, 400));

  const tr = await runDB(env, 'SELECT id FROM topics WHERE id = ? LIMIT 1', [topicId]);
  if (!tr.results || tr.results.length === 0)
    return cors(json({ message: 'topic not found' }, 404));

  await execDB(
    env,
    'INSERT INTO posts (topic_id, author_id, content, created_at) VALUES (?, ?, ?, ?)',
    [topicId, payload.uid, content, Date.now()]
  );
  return cors(json({ message: 'ok' }, 201));
}

/* ---------- helper for auth ---------- */
async function authPayload(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/);
  if (!m) return null;
  const token = m[1];
  return await verifyJWT(token, env);
}
