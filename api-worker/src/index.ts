import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
  KIE_AI_API_KEY: string;
  STRIPE_PRIVATE_KEY: string;
  OPENAI_API_KEY: string;
  OPENROUTER_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Color theme presets (must match frontend)
const COLOR_THEME_PRESETS: Record<string, { name: string; colors: [string, string, string] }> = {
  warm_sunset: { name: 'Warm Sunset', colors: ['#FF6B6B', '#FFA07A', '#FFD700'] },
  rose_garden: { name: 'Rose Garden', colors: ['#E91E63', '#FF80AB', '#FCE4EC'] },
  ocean_breeze: { name: 'Ocean Breeze', colors: ['#0077B6', '#00B4D8', '#90E0EF'] },
  forest_dream: { name: 'Forest Dream', colors: ['#2D6A4F', '#52B788', '#D8F3DC'] },
  lavender_night: { name: 'Lavender Night', colors: ['#7B2D8E', '#C084FC', '#F3E8FF'] },
};

// Explicit OPTIONS handler for CORS preflight
app.options('*', (c) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
});

// CORS middleware for all responses
app.use('*', async (c, next) => {
  await next();
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

async function verifyToken(authHeader: string | undefined) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.sub || payload.user_id || null;
  } catch (e) {
    return null;
  }
}

// Helper: call AI models with fallback chain
async function callAI(
  env: Bindings,
  systemPrompt: string,
  userPrompt: string
): Promise<{ html: string; error: string }> {
  const modelConfigs: Array<{type: string; slug?: string; model?: string; name: string}> = [
    { type: 'kie', slug: 'gemini-3-flash', name: 'Gemini 3 Flash (Kie.ai)' },
    { type: 'kie', slug: 'gemini-2-5-pro', name: 'Gemini 2.5 Pro (Kie.ai)' },
    { type: 'openrouter', model: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview (OpenRouter)' },
    { type: 'openrouter', model: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro (OpenRouter)' },
  ];

  let htmlContent = '';
  let lastError = '';

  for (const mc of modelConfigs) {
    try {
      let apiUrl: string;
      let apiKey: string;
      let requestBody: any;

      if (mc.type === 'kie') {
        apiUrl = `https://api.kie.ai/${mc.slug}/v1/chat/completions`;
        apiKey = env.KIE_AI_API_KEY;
        requestBody = {
          messages: [
            { role: 'system', content: [{ type: 'text', text: systemPrompt }] },
            { role: 'user', content: [{ type: 'text', text: userPrompt }] }
          ]
        };
      } else {
        apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        apiKey = env.OPENROUTER_API_KEY;
        requestBody = {
          model: mc.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const responseText = await response.text();

      if (response.ok) {
        const data = JSON.parse(responseText);
        if (data.choices?.[0]?.message) {
          htmlContent = data.choices[0].message.content;

          // Robust HTML extraction
          const codeBlockMatch = htmlContent.match(/```(?:html)?\s*\n?([\s\S]*?)\n?```/);
          if (codeBlockMatch) {
            htmlContent = codeBlockMatch[1].trim();
          }
          const doctypeIdx = htmlContent.indexOf('<!DOCTYPE');
          const htmlTagIdx = htmlContent.indexOf('<html');
          const startIdx = doctypeIdx >= 0 ? doctypeIdx : (htmlTagIdx >= 0 ? htmlTagIdx : -1);
          if (startIdx > 0) {
            htmlContent = htmlContent.substring(startIdx);
          }
          const endHtmlIdx = htmlContent.lastIndexOf('</html>');
          if (endHtmlIdx >= 0) {
            htmlContent = htmlContent.substring(0, endHtmlIdx + 7);
          }
          htmlContent = htmlContent.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();

          if (htmlContent.includes('<html') && htmlContent.includes('</html>')) {
            break;
          } else if (htmlContent.includes('<') && htmlContent.includes('>') && htmlContent.length > 200) {
            if (!htmlContent.includes('<html')) {
              htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Greeting Card</title></head><body>${htmlContent}</body></html>`;
            }
            break;
          } else {
            lastError = `[${mc.name}] Response did not contain valid HTML`;
            htmlContent = '';
          }
        }
      } else {
        lastError = `[${mc.name}] ${response.status}: ${responseText.substring(0, 200)}`;
      }
    } catch (e: any) {
      lastError = `[${mc.name}] ${e.message}`;
    }
  }

  return { html: htmlContent, error: lastError };
}

app.get('/', (c) => c.text('SyncHeartist API v17 (Edit + Fixed Flip)'));

// =============================================
// Upload: Stream directly to R2
// =============================================
app.post('/api/upload', async (c) => {
  try {
    const userId = await verifyToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const key = `uploads/${crypto.randomUUID()}`;
    const body = c.req.raw.body;
    
    if (!body) return c.json({ error: 'Empty body' }, 400);

    await c.env.R2.put(key, body, {
      httpMetadata: {
        contentType: c.req.header('Content-Type') || 'image/jpeg',
      },
    });

    return c.json({ key });
  } catch (err: any) {
    console.error('Upload error:', err.message);
    return c.json({ error: 'Upload failed: ' + err.message }, 500);
  }
});

app.put('/api/upload', async (c) => {
  try {
    const userId = await verifyToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const key = `uploads/${crypto.randomUUID()}`;
    const body = c.req.raw.body;
    
    if (!body) return c.json({ error: 'Empty body' }, 400);

    await c.env.R2.put(key, body, {
      httpMetadata: {
        contentType: c.req.header('Content-Type') || 'image/jpeg',
      },
    });

    return c.json({ key });
  } catch (err: any) {
    console.error('Upload error:', err.message);
    return c.json({ error: 'Upload failed: ' + err.message }, 500);
  }
});

// =============================================
// Stripe Checkout
// =============================================
app.post('/api/stripe/checkout', async (c) => {
  try {
    const userId = await verifyToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { credits, amountHkd } = await c.req.json();
    
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + c.env.STRIPE_PRIVATE_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'hkd',
        'line_items[0][price_data][product_data][name]': `SyncHeartist ${credits} Credits`,
        'line_items[0][price_data][unit_amount]': (amountHkd * 100).toString(),
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': 'https://syncheartist.com/?payment=success',
        'cancel_url': 'https://syncheartist.com/?payment=cancel',
        'metadata[userId]': userId,
        'metadata[credits]': credits.toString(),
      })
    });

    const session: any = await res.json();
    return c.json({ url: session.url });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// Stripe Webhook
// =============================================
app.post('/api/stripe/webhook', async (c) => {
  try {
    const body: any = await c.req.json();
    if (body.type === 'checkout.session.completed') {
      const session = body.data.object;
      const userId = session.metadata?.userId;
      const credits = parseInt(session.metadata?.credits || '0');

      if (userId && credits > 0) {
        await c.env.DB.prepare('INSERT OR IGNORE INTO User (id, email, passwordHash, displayName) VALUES (?, ?, ?, ?)')
          .bind(userId, `${userId}@syncheartist.local`, 'stripe-auto', 'Stripe User').run();

        await c.env.DB.prepare('INSERT INTO CreditWallet (id, userId, balance, updatedAt) VALUES (?, ?, ?, ?) ON CONFLICT(userId) DO UPDATE SET balance = balance + ?, updatedAt = ?')
          .bind(crypto.randomUUID(), userId, credits, Date.now(), credits, Date.now()).run();
      }
    }
    return c.json({ received: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// AI Generation
// =============================================
app.post('/api/generate', async (c) => {
  try {
    if (!c.env.KIE_AI_API_KEY) {
      return c.json({ error: 'Server configuration error: AI Key missing' }, 500);
    }

    const userId = await verifyToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const { 
      prompt, imageKey, festival, decorations, extraNote, interactiveEffect,
      colorTheme, escapeQuestion, escapeAcceptText, escapeRejectText,
      popOverBtnText, popOverMessage, cardLabel, recipientName, cardLanguage
    } = body;
    
    if (!prompt) return c.json({ error: 'Prompt is required' }, 400);
    
    await c.env.DB.prepare('INSERT OR IGNORE INTO User (id, email, passwordHash, displayName) VALUES (?, ?, ?, ?)')
      .bind(userId, `${userId}@syncheartist.local`, 'firebase-oauth', 'Firebase User').run();

    const baseCost = 10;
    const imageCost = imageKey ? 10 : 0;
    const interactiveCost = interactiveEffect ? 5 : 0;
    const cost = baseCost + imageCost + interactiveCost;
    const wallet = await c.env.DB.prepare('SELECT balance FROM CreditWallet WHERE userId = ?').bind(userId).first();
    const balance = wallet ? (wallet as any).balance : 0;
    
    if (balance < cost) {
      return c.json({ error: `點數不足。需要 ${cost} 點，目前餘額 ${balance} 點` }, 403);
    }

    let htmlContent = '';
    let lastError = '';

    // Build the image URL if user uploaded one
    let imageUrl = '';
    if (imageKey) {
      imageUrl = `https://api.syncheartist.com/r2/${imageKey}`;
    }

    // Resolve color theme
    let colorColors: [string, string, string] = ['#FF6B6B', '#FFA07A', '#FFD700'];
    let colorThemeName = 'Warm Sunset';
    let useGradient = false;
    if (colorTheme) {
      useGradient = colorTheme.useGradient || false;
      if (colorTheme.key === 'custom' && colorTheme.colors) {
        colorColors = colorTheme.colors;
        colorThemeName = 'Custom';
      } else if (COLOR_THEME_PRESETS[colorTheme.key]) {
        colorColors = COLOR_THEME_PRESETS[colorTheme.key].colors;
        colorThemeName = COLOR_THEME_PRESETS[colorTheme.key].name;
      }
    }

    const colorInstructions = `
COLOR THEME: ${colorThemeName}
Primary Color: ${colorColors[0]}
Secondary Color: ${colorColors[1]}
Background/Accent Color: ${colorColors[2]}
${useGradient ? 'GRADIENT MODE: Use these colors as gradient transitions for backgrounds, buttons, and decorative elements.' : 'SOLID MODE: Use these three colors as the main color palette.'}
You MUST use these exact colors as the dominant palette throughout the entire card design.`;

    let decorationInstructions = '';
    if (decorations && decorations.length > 0) {
      decorationInstructions = `
DECORATIONS: ${decorations.join(', ')}
Incorporate these decorations visually using CSS animations, emoji, SVG, or creative HTML/CSS. Make them prominent and visible.`;
    }

    const blessing = prompt;
    // Build recipient name instruction
    const recipientInstruction = recipientName ? `\nRECIPIENT: The card is addressed to "${recipientName}". Use this name naturally in the greeting (e.g., "Dear ${recipientName}", "To ${recipientName}", or address them directly in the blessing).` : '';
    // Build language instruction
    const langCode = cardLanguage === 'en' ? 'en' : 'zh-TW';
    const languageInstruction = cardLanguage === 'en'
      ? `\nPAGE LANGUAGE: All text content on the generated page MUST be written in English. This includes titles, buttons, labels, and the blessing message.`
      : `\nPAGE LANGUAGE: All text content on the generated page MUST be written in Traditional Chinese (繁體中文). This is Traditional Chinese as used in Hong Kong and Taiwan — NOT Simplified Chinese (简体中文). Every single word, button, label, title, and message must use Traditional Chinese characters. Do NOT use Simplified Chinese under any circumstances.`;

    // Build interactive effect instructions
    let interactiveInstructions = '';
    let isFlipCard = false;

    if (interactiveEffect === 'flipOpen' || interactiveEffect === 'flipBack') {
      isFlipCard = true;
      const flipLabel = interactiveEffect === 'flipOpen' ? 'Flip Open' : 'Front-Back Flip';
      interactiveInstructions = `
INTERACTIVE EFFECT: ${flipLabel} Card

⚠️ CRITICAL: You MUST output a COMPLETE working flip card. Copy the structure below EXACTLY, only changing the content text, colors, and decorations.

<!DOCTYPE html>
<html lang="${langCode}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Greeting Card</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${useGradient ? `linear-gradient(135deg, ${colorColors[2]}, ${colorColors[1]}, ${colorColors[0]})` : colorColors[2]};
  font-family: 'Georgia', serif;
  overflow: hidden;
}
.scene {
  perspective: 1200px;
  width: 340px;
  height: 480px;
}
.card {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}
.card.flipped {
  transform: rotateY(180deg);
}
.card-face {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  overflow: hidden;
}
.card-front {
  background: ${useGradient ? `linear-gradient(160deg, ${colorColors[0]}, ${colorColors[1]})` : colorColors[0]};
  color: white;
}
.card-back {
  background: ${useGradient ? `linear-gradient(160deg, ${colorColors[1]}, ${colorColors[2]})` : colorColors[2]};
  color: #333;
  transform: rotateY(180deg);
}
.card-front h1 {
  font-size: 2em;
  margin-bottom: 16px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}
.card-front .decorations {
  font-size: 2.5em;
  margin: 20px 0;
}
.flip-btn {
  padding: 12px 32px;
  border: 2px solid white;
  background: rgba(255,255,255,0.2);
  color: white;
  border-radius: 30px;
  font-size: 1em;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s;
  backdrop-filter: blur(5px);
}
.flip-btn:hover {
  background: rgba(255,255,255,0.4);
  transform: scale(1.05);
}
.card-back .flip-btn {
  border-color: ${colorColors[0]};
  color: ${colorColors[0]};
  background: rgba(255,255,255,0.5);
}
.card-back .flip-btn:hover {
  background: ${colorColors[0]};
  color: white;
}
.blessing {
  font-size: 1.15em;
  line-height: 1.8;
  margin: 16px 0;
  padding: 0 8px;
}
.photo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid ${colorColors[0]};
  margin-bottom: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.float { animation: float 3s ease-in-out infinite; }
</style>
</head>
<body>
<div class="scene">
  <div class="card" id="flipCard">
    <div class="card-face card-front">
      <div class="decorations float">REPLACE_WITH_EMOJI_DECORATIONS</div>
      <h1>REPLACE_WITH_FESTIVAL_TITLE</h1>
      <p style="opacity:0.9;margin-bottom:8px;">REPLACE_WITH_SUBTITLE</p>
      <button class="flip-btn" onclick="document.getElementById('flipCard').classList.add('flipped')">
        ${cardLanguage === 'en' ? (interactiveEffect === 'flipOpen' ? '✨ Click to Open ✨' : '🔄 Flip Over') : (interactiveEffect === 'flipOpen' ? '✨ 點擊開啟 ✨' : '🔄 翻轉')}
      </button>
    </div>
    <div class="card-face card-back">
      ${imageUrl ? `<img class="photo" src="${imageUrl}" alt="photo"/>` : ''}
      <p class="blessing">${blessing}</p>
      <button class="flip-btn" onclick="document.getElementById('flipCard').classList.remove('flipped')">
        ${cardLanguage === 'en' ? (interactiveEffect === 'flipOpen' ? '← Close' : '🔄 Flip Back') : (interactiveEffect === 'flipOpen' ? '← 關閉' : '🔄 翻回')}
      </button>
    </div>
  </div>
</div>
</body>
</html>

INSTRUCTIONS FOR THE ABOVE TEMPLATE:
1. Replace REPLACE_WITH_EMOJI_DECORATIONS with 3-5 emoji that match the festival (e.g., 🎂🎉🎈 for birthday, 💐🌸💝 for Mother's Day)
2. Replace REPLACE_WITH_FESTIVAL_TITLE with a greeting title matching the festival
3. Replace REPLACE_WITH_SUBTITLE with a short subtitle
4. You MAY enhance the CSS with additional animations, decorative pseudo-elements, or background patterns
5. You MAY add more decorative elements to both faces
6. You MUST keep the flip mechanism exactly as shown (classList.add/remove 'flipped')
7. You MUST keep both card-face elements with backface-visibility: hidden
8. The blessing text and photo MUST remain on the back face
9. The front and back MUST have visually different designs (different colors/gradients)
10. DO NOT change the core flip CSS structure`;

    } else if (interactiveEffect === 'escapeBtn') {
      const questionText = escapeQuestion || 'Do you accept?';
      const acceptText = escapeAcceptText || 'Yes';
      const rejectText = escapeRejectText || 'No';
      interactiveInstructions = `
INTERACTIVE EFFECT: Escaping Button Game

LAYOUT STRUCTURE (top to bottom):
1. The user's photo (if provided) at the top, with proper spacing
2. Below the photo, display this question prominently: "${questionText}"
3. Below the question, two buttons: "${acceptText}" (positive) and "${rejectText}" (negative)

SPACING RULE: The accept button MUST NOT overlap the photo. Keep at least 40px gap.

BEHAVIOR on clicking "${rejectText}":
- The reject button moves to a random position (position: absolute, random top/left within viewport)
- The "${acceptText}" button grows slightly (10-15% per click, max 2x)

BEHAVIOR on clicking "${acceptText}":
- Hide question and buttons
- Show blessing message with animation
- Trigger confetti effect (JS canvas particles, no external library)
- Display photo prominently if provided
- Show decorative elements matching the festival`;

    } else if (interactiveEffect === 'popOver') {
      const btnText = popOverBtnText || 'Click Me';
      const msgText = popOverMessage || 'I love you!';
      interactiveInstructions = `
INTERACTIVE EFFECT: Pop-over Message
Implement a page with:
1. A main card containing: festival title, blessing message, user's photo, and a button "${btnText}"
2. When button is clicked, show a POP-OVER overlay:
   - Fixed center (top:50%, left:50%, transform:translate(-50%,-50%))
   - Themed background color
   - Shows the message: "${msgText}" and photo if provided
   - Fade in with scale animation (0.8→1.1→1.0)
   - Auto-dismiss after 3 seconds with fade-out
   - Visually striking with rounded corners and shadow`;
    }

    // System prompt
    const systemPrompt = `You are a professional web designer that ONLY outputs raw HTML code. You NEVER include any explanations, markdown formatting, code fences, or conversational text. Your entire response must be a single valid HTML document starting with <!DOCTYPE html> and ending with </html>. Do not wrap your response in code blocks. Do not add any text before or after the HTML.`;

    // User prompt - different for flip cards vs others
    let userPrompt: string;

    if (isFlipCard) {
      // For flip cards: use the template-based approach, less creative freedom on structure
      userPrompt = `Create a flip card greeting page based on the template below. You MUST follow the template structure exactly for the flip mechanism, but you CAN enhance the visual design.

CRITICAL OUTPUT RULES:
- Your ENTIRE response must be ONLY the HTML code
- Start with <!DOCTYPE html> and end with </html>
- Do NOT include any markdown, code fences, explanations, or commentary

Theme/Festival: ${festival || 'General'}
${decorationInstructions}
${colorInstructions}
Blessing Message: ${blessing}${recipientInstruction}${languageInstruction}
${extraNote ? 'Extra Note: ' + extraNote : ''}
${imageUrl ? `User Photo URL: ${imageUrl} — Display on the BACK face as a circular photo.` : ''}
${interactiveInstructions}

TECHNICAL REQUIREMENTS:
- The page MUST fill the full viewport (min-height: 100vh)
- MUST be mobile-responsive
- Use proper viewport meta tag
- All JavaScript must be inline
- The flip mechanism MUST work correctly with the classList toggle approach`;
    } else {
      // For non-flip cards: full creative freedom
      userPrompt = `Create a stunning, immersive, standalone HTML greeting card page. You are a world-class web designer — be creative, expressive, and bold.

CRITICAL OUTPUT RULES:
- Your ENTIRE response must be ONLY the HTML code
- Start with <!DOCTYPE html> and end with </html>
- Do NOT include any markdown, code fences, explanations, or commentary

Theme/Festival: ${festival || 'General'}
${decorationInstructions}
${colorInstructions}
Blessing Message: ${blessing}${recipientInstruction}${languageInstruction}
${extraNote ? 'Extra Note: ' + extraNote : ''}
${imageUrl ? `User Photo URL: ${imageUrl}
Display the photo prominently — circular avatar, polaroid frame, hero banner, or any creative presentation.` : ''}
${interactiveInstructions}

DESIGN PHILOSOPHY — BE CREATIVE:
- You have FULL creative freedom over layout, typography, animations, and visual style
- Do NOT use a boring centered card in a white box — think outside the box!
- Consider: full-screen immersive backgrounds, glassmorphism, animated SVG, particle effects, gradient mesh, clip-path shapes, kinetic typography
- Each card should feel unique and emotionally resonant with the occasion
- Use creative CSS animations: floating elements, pulsing glows, shimmer effects, typewriter reveals, staggered fade-ins

TECHNICAL REQUIREMENTS:
- The page MUST fill the full viewport (min-height: 100vh, width: 100%)
- MUST be mobile-responsive
- The blessing message MUST be prominently displayed and readable
- All JavaScript must be inline (no external dependencies)
- Use proper viewport meta tag
- Ensure text is readable against backgrounds
${imageUrl ? '- The user photo MUST be displayed prominently' : ''}
${interactiveEffect ? '- The interactive effect described above is MANDATORY' : ''}
${!interactiveEffect ? '- Add subtle interactive touches: hover effects, scroll-triggered animations, or entrance animation sequence' : ''}`;
    }

    const result = await callAI(c.env, systemPrompt, userPrompt);
    htmlContent = result.html;
    lastError = result.error;

    if (!htmlContent) {
      console.error('All models failed. Last error:', lastError);
      return c.json({ error: `AI Generation Failed: ${lastError}` }, 500);
    }
    
    const uniqueId = crypto.randomUUID();
    const fileKey = `cards/${uniqueId}.html`;

    await c.env.R2.put(fileKey, htmlContent, {
      httpMetadata: { contentType: 'text/html; charset=utf-8' }
    });

    const shareLink = 'https://api.syncheartist.com/view/' + uniqueId;
    
    // Deduct credits
    await c.env.DB.prepare('UPDATE CreditWallet SET balance = balance - ?, updatedAt = ? WHERE userId = ?')
      .bind(cost, Date.now(), userId).run();

    const colorMeta = JSON.stringify({ key: colorTheme?.key || 'warm_sunset', colors: colorColors, gradient: useGradient });

    await c.env.DB.prepare(`
      INSERT INTO GenerationJob (
        id, userId, status, festivalKey, styleCategory, styleKey, 
        decorationsJson, blessingText, extraPrompt, finalPromptText,
        estimatedCreditCost, actualCreditCost, shareLink, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      uniqueId, userId, 'succeeded', 
      festival || 'Other', 'color_theme', colorTheme?.key || 'warm_sunset', 
      JSON.stringify(decorations || []), prompt, 
      cardLabel || '',
      colorMeta,
      cost, cost, shareLink, Date.now()
    ).run();

    return c.json({ shareLink, remainingCredits: balance - cost });
  } catch (err: any) {
    console.error('Generate Error:', err.message);
    return c.json({ error: '系統繁忙，請稍後再試' }, 500);
  }
});

// =============================================
// Edit Card (one-time modification)
// =============================================
app.post('/api/edit/:id', async (c) => {
  try {
    const userId = await verifyToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const cardId = c.req.param('id');
    const { editInstruction } = await c.req.json();

    if (!editInstruction) return c.json({ error: 'Edit instruction is required' }, 400);

    // Verify the card belongs to this user
    const job = await c.env.DB.prepare('SELECT userId FROM GenerationJob WHERE id = ?').bind(cardId).first();
    if (!job || (job as any).userId !== userId) {
      return c.json({ error: 'Card not found or unauthorized' }, 404);
    }

    // Fetch the existing HTML from R2
    const existingObj = await c.env.R2.get(`cards/${cardId}.html`);
    if (!existingObj) {
      return c.json({ error: 'Original card HTML not found' }, 404);
    }
    const existingHtml = await existingObj.text();

    // Build edit prompt
    const systemPrompt = `You are a professional web designer that modifies existing HTML code. You ONLY output the complete modified HTML document. You NEVER include explanations, markdown, code fences, or conversational text. Your entire response must be a single valid HTML document starting with <!DOCTYPE html> and ending with </html>.`;

    const userPrompt = `Here is an existing HTML greeting card page. The user wants to make the following modification:

USER'S EDIT REQUEST: "${editInstruction}"

EXISTING HTML:
${existingHtml}

INSTRUCTIONS:
1. Apply the user's requested modification to the existing HTML
2. Keep everything else the same — do not redesign the entire page
3. Only change what the user specifically asked for
4. Maintain all existing interactive effects, animations, and functionality
5. Output the COMPLETE modified HTML document
6. Do NOT include any markdown, code fences, or explanations`;

    const result = await callAI(c.env, systemPrompt, userPrompt);

    if (!result.html) {
      return c.json({ error: `Edit failed: ${result.error}` }, 500);
    }

    // Save as preview version
    const previewKey = `cards/${cardId}_preview.html`;
    await c.env.R2.put(previewKey, result.html, {
      httpMetadata: { contentType: 'text/html; charset=utf-8' }
    });

    const previewLink = `https://api.syncheartist.com/view/${cardId}_preview`;

    return c.json({ previewLink, originalLink: `https://api.syncheartist.com/view/${cardId}` });
  } catch (err: any) {
    console.error('Edit Error:', err.message);
    return c.json({ error: '修改失敗，請稍後再試' }, 500);
  }
});

// =============================================
// Confirm Edit (keep new or revert)
// =============================================
app.post('/api/edit/:id/confirm', async (c) => {
  try {
    const userId = await verifyToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const cardId = c.req.param('id');
    const { keepNew } = await c.req.json();

    // Verify ownership
    const job = await c.env.DB.prepare('SELECT userId FROM GenerationJob WHERE id = ?').bind(cardId).first();
    if (!job || (job as any).userId !== userId) {
      return c.json({ error: 'Card not found or unauthorized' }, 404);
    }

    const previewKey = `cards/${cardId}_preview.html`;

    if (keepNew) {
      // Replace original with preview
      const previewObj = await c.env.R2.get(previewKey);
      if (!previewObj) {
        return c.json({ error: 'Preview version not found' }, 404);
      }
      const newHtml = await previewObj.text();
      
      // Overwrite original
      await c.env.R2.put(`cards/${cardId}.html`, newHtml, {
        httpMetadata: { contentType: 'text/html; charset=utf-8' }
      });
    }

    // Delete preview regardless
    await c.env.R2.delete(previewKey);

    return c.json({ success: true, link: `https://api.syncheartist.com/view/${cardId}` });
  } catch (err: any) {
    console.error('Confirm Error:', err.message);
    return c.json({ error: '確認失敗，請稍後再試' }, 500);
  }
});

// =============================================
// User Data
// =============================================
app.get('/api/user/:uid', async (c) => {
  try {
    const uid = c.req.param('uid');
    const authUid = await verifyToken(c.req.header('Authorization'));
    if (!authUid || authUid !== uid) return c.json({ error: 'Unauthorized' }, 401);

    let wallet: any = await c.env.DB.prepare('SELECT balance FROM CreditWallet WHERE userId = ?').bind(uid).first();
    let isNewUser = false;
    
    if (!wallet) {
      isNewUser = true;
      
      await c.env.DB.prepare('INSERT OR IGNORE INTO User (id, email, passwordHash, displayName) VALUES (?, ?, ?, ?)')
        .bind(uid, `${uid}@syncheartist.local`, 'trial', 'New User').run();
      
      const existingUser = await c.env.DB.prepare('SELECT id FROM User WHERE id = ?').bind(uid).first();
      if (!existingUser) {
        await c.env.DB.prepare('INSERT OR IGNORE INTO User (id, email, passwordHash, displayName) VALUES (?, ?, ?, ?)')
          .bind(uid, `user_${uid}_${Date.now()}@syncheartist.local`, 'trial', 'New User').run();
      }
      
      try {
        await c.env.DB.prepare('INSERT INTO CreditWallet (id, userId, balance, updatedAt) VALUES (?, ?, ?, ?)')
          .bind(crypto.randomUUID(), uid, 10, Date.now()).run();
        wallet = { balance: 10 };
      } catch (walletErr: any) {
        wallet = await c.env.DB.prepare('SELECT balance FROM CreditWallet WHERE userId = ?').bind(uid).first();
        if (!wallet) {
          wallet = { balance: 0 };
        }
        isNewUser = false;
      }
    }

    const history = await c.env.DB.prepare(`
      SELECT id, festivalKey, styleKey, shareLink, createdAt, 
             extraPrompt as cardLabel, finalPromptText as colorMeta, blessingText
      FROM GenerationJob 
      WHERE userId = ? 
      ORDER BY createdAt DESC 
      LIMIT 50
    `).bind(uid).all();

    return c.json({
      credits: wallet ? (wallet as any).balance : 0,
      history: history.results || [],
      isNewUser
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// =============================================
// Serve R2 images publicly
// =============================================
app.get('/r2/*', async (c) => {
  const key = c.req.path.replace('/r2/', '');
  const object = await c.env.R2.get(key);
  if (!object) return c.text('Not found', 404);
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000');
  headers.set('Access-Control-Allow-Origin', '*');
  
  return new Response(object.body, { headers });
});

// =============================================
// View Card (supports both original and preview)
// =============================================
app.get('/view/:id', async (c) => {
  const id = c.req.param('id');
  const fileKey = `cards/${id}.html`;
  const object = await c.env.R2.get(fileKey);
  if (!object) return c.text('Card not found', 404);
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'public, max-age=31536000');
  
  return new Response(object.body, { headers });
});

export default app;
