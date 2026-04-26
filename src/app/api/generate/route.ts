export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { uploadHtmlToR2, uploadImageToR2 } from '@/lib/r2';

export async function POST(req: Request) {
  try {
    const prisma = getPrismaClient();
    const { prompt, cost, imageBase64 } = await req.json() as { prompt: string; cost: number; imageBase64: string };

    const userId = "mock-user-id"; // MVP: Use mock user

    // Deduct credits
    const wallet = await prisma.creditWallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < cost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Reserve credits
    await prisma.creditWallet.update({
      where: { userId },
      data: { balance: { decrement: cost } }
    });

    const job = await prisma.generationJob.create({
      data: {
        userId,
        status: 'processing',
        festivalKey: 'mock',
        styleCategory: 'mock',
        styleKey: 'mock',
        decorationsJson: '[]',
        blessingText: 'mock',
        estimatedCreditCost: cost,
      }
    });

    let uploadedImageUrl = '';
    
    // Upload original user photo to R2 first
    if (imageBase64) {
      try {
        const ext = imageBase64.includes('image/png') ? 'png' : 'jpg';
        const imageKey = `generations/${job.id}/photo.${ext}`;
        uploadedImageUrl = await uploadImageToR2(imageBase64, imageKey);
      } catch (uploadErr) {
        console.warn("Failed to upload image to R2:", uploadErr);
      }
    }

    let generatedHtml = '';

    // Call OpenRouter AI
    try {
      const messages: { role: string; content: string | { type: string; text?: string; image_url?: { url: string } }[] }[] = [
        { 
          role: "system", 
          content: "You are an expert web developer and designer. Your task is to generate a complete, responsive, and beautiful HTML file for a personalized greeting card website.\n\nCRITICAL INSTRUCTIONS:\n1. You MUST output ONLY valid HTML code.\n2. Do NOT include markdown formatting like ```html.\n3. Do NOT include any explanations. Just the raw HTML code starting with <!DOCTYPE html>.\n4. The HTML must include inline CSS for styling and be fully responsive.\n5. The user will provide their specific selections including Occasion (節日/時刻), Style (風格), Decorations (裝飾), and their Blessing (祝福語).\n6. You MUST strictly incorporate these selections into your HTML design. Use the specified style for the CSS theme, include the decorations visually (using CSS, emojis, or SVG), and prominently display the user's blessing message in Traditional Chinese." 
        }
      ];

      let userPrompt = `Here are the user's selections from the website:\n${prompt}`;
      if (uploadedImageUrl) {
        userPrompt += `\n\nAlso, elegantly include this image URL in the HTML layout using an <img> tag: ${uploadedImageUrl}`;
      }

      const userContent: { type: string; text?: string; image_url?: { url: string } }[] = [{ type: "text", text: userPrompt }];
      if (imageBase64) {
        userContent.push({
          type: "image_url",
          image_url: { url: imageBase64 }
        });
      }
      messages.push({ role: "user", content: userContent });

      const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://pub-75e8fc0c6ad94111a9fd19f56a9eef10.r2.dev",
          "X-Title": "SyncHeartist",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: messages,
        })
      });

      if (openRouterRes.ok) {
        const data = await openRouterRes.json() as { choices?: { message?: { content?: string } }[] };
        if (data.choices && data.choices[0] && data.choices[0].message) {
          generatedHtml = data.choices[0].message.content || '';
          generatedHtml = generatedHtml.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();
        }
      } else {
        const errText = await openRouterRes.text();
        console.warn("OpenRouter API returned an error status:", openRouterRes.status, errText);
      }
    } catch (apiErr) {
      console.warn("Failed to call OpenRouter API:", apiErr);
    }

    // Assemble the final HTML website
    let htmlContent = generatedHtml;
    // Fallback if AI fails to return valid HTML
    if (!htmlContent || !htmlContent.toLowerCase().includes('<!doctype html>')) {
      htmlContent = `
<!DOCTYPE html>
<html lang="zh-HK">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SyncHeartist - 專屬祝福</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap');
    body { font-family: 'Noto Sans TC', sans-serif; background: linear-gradient(135deg, #fff0f6 0%, #ffe6f0 100%); color: #8f4c70; text-align: center; padding: 40px 20px; }
    .card { background: #ffffff; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 32px; box-shadow: 0 20px 40px rgba(179,69,127,0.08); }
    img { max-width: 100%; border-radius: 20px; margin-bottom: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
    h1 { color: #b3457f; font-size: 2rem; margin-top: 0; margin-bottom: 24px; }
    .message { font-size: 1.25rem; line-height: 1.8; color: #7d4863; white-space: pre-wrap; text-align: left; background: #fff6fb; padding: 24px; border-radius: 16px; border: 1px dashed #ffc9e1; }
    .footer { margin-top: 32px; font-size: 0.9rem; color: #a56a87; }
    .footer a { color: #b3457f; text-decoration: none; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎀 給你的專屬心意</h1>
    ${uploadedImageUrl ? `<img src="${uploadedImageUrl}" alt="相片" />` : ''}
    <div class="message">${generatedHtml || '生成失敗，請稍後再試。'}</div>
    <div class="footer">本心意卡由 <a href="https://syncheartist.com" target="_blank">SyncHeartist</a> 製作</div>
  </div>
</body>
</html>`;
    }

    // Upload the final HTML to R2
    let shareLink = '';
    try {
      const fileKey = `generations/${job.id}/index.html`;
      shareLink = await uploadHtmlToR2(htmlContent, fileKey);
    } catch (uploadErr) {
      console.error("Failed to upload HTML to R2:", uploadErr);
      await prisma.creditWallet.update({
        where: { userId },
        data: { balance: { increment: cost } }
      });
      await prisma.generationJob.update({
        where: { id: job.id },
        data: { status: 'failed', errorMessage: 'R2 Upload failed' }
      });
      return NextResponse.json({ error: 'Failed to deploy generated website' }, { status: 500 });
    }

    // Succeeded
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: 'succeeded', actualCreditCost: cost, shareLink }
    });
    
    await prisma.creditTransaction.create({
      data: {
        userId,
        type: 'deduct',
        amount: -cost,
        status: 'completed',
        referenceType: 'generation',
        referenceId: job.id
      }
    });

    return NextResponse.json({ result: 'success', shareLink });
  } catch (error: unknown) {
    console.error('Generation Error:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
