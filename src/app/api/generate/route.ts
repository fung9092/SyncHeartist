import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { uploadHtmlToR2, uploadImageToR2 } from '@/lib/r2';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { prompt, cost, imageBase64 } = await req.json();

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
    let generatedText = '恭喜！這是一份為您特別準備的心意。';

    // Call OpenRouter AI
    try {
      const messages: any[] = [
        { role: "system", content: "You are a warm, personalized AI greeting card assistant. Based on the user's prompt and occasion, write a beautiful and festive blessing message in Traditional Chinese." }
      ];

      // Add user prompt and optional image
      const userContent: any[] = [{ type: "text", text: prompt }];
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
          model: "google/gemini-2.5-flash", // Fast, vision-capable, no geo-block
          messages: messages,
        })
      });

      if (openRouterRes.ok) {
        const data = await openRouterRes.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
          generatedText = data.choices[0].message.content;
        }
      } else {
        const errText = await openRouterRes.text();
        console.warn("OpenRouter API returned an error status:", openRouterRes.status, errText);
      }
    } catch (apiErr) {
      console.warn("Failed to call OpenRouter API:", apiErr);
    }

    // Upload original user photo to R2 for the card display
    if (imageBase64) {
      try {
        const ext = imageBase64.includes('image/png') ? 'png' : 'jpg';
        const imageKey = `generations/${job.id}/photo.${ext}`;
        uploadedImageUrl = await uploadImageToR2(imageBase64, imageKey);
      } catch (uploadErr) {
        console.warn("Failed to upload image to R2:", uploadErr);
      }
    }

    // Assemble the final HTML website
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-HK">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SyncHeartist - 專屬祝福</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap');
    body { 
      font-family: 'Noto Sans TC', sans-serif; 
      background: linear-gradient(135deg, #fff0f6 0%, #ffe6f0 100%);
      color: #8f4c70; 
      text-align: center; 
      padding: 40px 20px;
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .card { 
      background: #ffffff; 
      max-width: 600px; 
      width: 100%;
      margin: 0 auto; 
      padding: 40px 30px; 
      border-radius: 32px; 
      box-shadow: 0 20px 40px rgba(179, 69, 127, 0.08); 
    }
    img { 
      max-width: 100%; 
      height: auto;
      border-radius: 20px; 
      margin-bottom: 24px; 
      box-shadow: 0 8px 24px rgba(0,0,0,0.06);
    }
    h1 { 
      color: #b3457f; 
      font-size: 2rem;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .message { 
      font-size: 1.25rem; 
      line-height: 1.8; 
      color: #7d4863;
      white-space: pre-wrap;
      text-align: left;
      background: #fff6fb;
      padding: 24px;
      border-radius: 16px;
      border: 1px dashed #ffc9e1;
    }
    .footer {
      margin-top: 32px;
      font-size: 0.9rem;
      color: #a56a87;
    }
    .footer a {
      color: #b3457f;
      text-decoration: none;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎀 給你的專屬心意</h1>
    ${uploadedImageUrl ? `<img src="${uploadedImageUrl}" alt="相片" />` : ''}
    <div class="message">${generatedText}</div>
    <div class="footer">
      本心意卡由 <a href="https://syncheartist.com" target="_blank">SyncHeartist</a> 製作
    </div>
  </div>
</body>
</html>`;

    // Upload the final HTML to R2
    let shareLink = '';
    try {
      const fileKey = `generations/${job.id}/index.html`;
      shareLink = await uploadHtmlToR2(htmlContent, fileKey);
    } catch (uploadErr) {
      console.error("Failed to upload HTML to R2:", uploadErr);
      // Refund on failure
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
    
    // Log transaction
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

    return NextResponse.json({ result: generatedText, shareLink });
  } catch (error: any) {
    console.error('Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
