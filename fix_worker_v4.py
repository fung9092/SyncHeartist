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

// Robust CORS configuration
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}));

async function verifyToken(authHeader: string | undefined) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub; 
  } catch (e) {
    return null;
  }
}

app.get('/', (c) => c.text('SyncHeartist API v4 (Robust)'));

app.put('/api/upload', async (c) => {
  try {
    const userId = await verifyToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.arrayBuffer();
    if (body.byteLength === 0) return c.json({ error: 'Empty body' }, 400);

    const key = `uploads/${crypto.randomUUID()}`;
    await c.env.R2.put(key, body);
    return c.json({ key });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/generate', async (c) => {
  try {
    const userId = await verifyToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { prompt, imageKey } = await c.req.json();
    if (!prompt) return c.json({ error: 'Prompt is required' }, 400);
    
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
        messages: [{ role: 'user', content: 'Generate a beautiful, standalone HTML greeting card for: ' + prompt + '. Return ONLY the HTML code.' }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({ error: 'OpenRouter error: ' + errorText }, response.status);
    }

    const data: any = await response.json();
    if (!data.choices || !data.choices[0]) {
      return c.json({ error: 'Invalid response from AI' }, 500);
    }

    const htmlContent = data.choices[0].message.content;
    // Use a unique UUID for every single generation to ensure unique URLs
    const uniqueId = crypto.randomUUID();
    const fileKey = `cards/${uniqueId}.html`;

    await c.env.R2.put(fileKey, htmlContent, {
      httpMetadata: { contentType: 'text/html; charset=utf-8' }
    });

    await c.env.DB.prepare('INSERT INTO GenerationJob (id, userId, status, prompt, resultUrl) VALUES (?, ?, ?, ?, ?)')
      .bind(uniqueId, userId, 'succeeded', prompt, fileKey).run();

    return c.json({ shareLink: 'https://api.syncheartist.com/view/' + uniqueId });
  } catch (err: any) {
    console.error('Worker Error:', err.message);
    return c.json({ error: 'Internal Server Error: ' + err.message }, 500);
  }
});

app.get('/view/:id', async (c) => {
  const id = c.req.param('id');
  const fileKey = `cards/` + id + '.html';
  const object = await c.env.R2.get(fileKey);
  if (!object) return c.text('Card not found', 404);
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'public, max-age=31536000');
  
  return new Response(object.body, { headers });
});

export default app;
"""
with open(path, 'w') as f:
    f.write(content)
