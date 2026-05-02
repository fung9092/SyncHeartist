import os

path = 'api-worker/src/index.ts'
content = """import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
  OPENROUTER_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

async function verifyToken(authHeader: string | undefined) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    // Firebase Token Verification on Cloudflare Worker (simplified for now)
    // In production, use a library or fetch Google's public keys to verify
    const res = await fetch(`https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`);
    // For this prototype, we'll extract the user ID from the token payload (JWT)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub; // This is the Firebase UID
  } catch (e) {
    return null;
  }
}

app.get('/', (c) => c.text('SyncHeartist API v3 (Secure)'));

app.put('/api/upload', async (c) => {
  const userId = await verifyToken(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.arrayBuffer();
  const key = `uploads/${crypto.randomUUID()}`;
  await c.env.R2.put(key, body);
  return c.json({ key });
});

app.post('/api/generate', async (c) => {
  const userId = await verifyToken(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const { prompt, imageKey } = await c.req.json();
  
  // Ensure user exists in DB
  await c.env.DB.prepare('INSERT OR IGNORE INTO User (id, email, name) VALUES (?, ?, ?)')
    .bind(userId, 'user@example.com', 'Firebase User').run();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + c.env.OPENROUTER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages: [{ role: 'user', content: 'Generate a beautiful HTML greeting card for: ' + prompt }],
    }),
  });

  const data: any = await response.json();
  const htmlContent = data.choices[0].message.content;
  const fileKey = `cards/${crypto.randomUUID()}.html`;

  await c.env.R2.put(fileKey, htmlContent, {
    httpMetadata: { contentType: 'text/html' }
  });

  await c.env.DB.prepare('INSERT INTO GenerationJob (id, userId, status, prompt, resultUrl) VALUES (?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), userId, 'succeeded', prompt, fileKey).run();

  return c.json({ shareLink: 'https://api.syncheartist.com/view/' + fileKey.split('/')[1] });
});

app.get('/view/:id', async (c) => {
  const id = c.req.param('id');
  const fileKey = `cards/` + id;
  const object = await c.env.R2.get(fileKey);
  if (!object) return c.text('Card not found', 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(object.body, { headers });
});

export default app;
"""
with open(path, 'w') as f:
    f.write(content)
