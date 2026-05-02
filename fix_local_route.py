import os
path = 'src/app/api/generate/route.ts'
content = r"""import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma_local';
import { uploadHtmlToR2 } from '@/lib/r2';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, style, userId: bodyUserId } = body;
    const userId = bodyUserId || "test-user-id";
    
    const env = (request as any).env || { 
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
      R2_PUBLIC_DOMAIN: process.env.R2_PUBLIC_DOMAIN
    };
    
    const prisma = getPrisma(env);
    const cost = 1;
    
    let wallet = await prisma.creditWallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.creditWallet.create({ data: { userId, balance: 10 } });
    }
    
    if (wallet.balance < cost) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 403 });
    }
    
    const job = await prisma.generationJob.create({
      data: { 
        userId, 
        status: 'processing',
        festivalKey: 'general',
        styleCategory: 'art_illustration',
        styleKey: style || 'modern',
        decorationsJson: '[]',
        blessingText: prompt || 'Happy Birthday!',
        estimatedCreditCost: cost
      }
    });
    
    await prisma.creditWallet.update({
      where: { userId },
      data: { balance: { decrement: cost } }
    });
    
    let generatedHtml = '';
    try {
      const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            { role: "system", content: "Create a beautiful interactive greeting card in HTML/CSS based on the prompt. Output only the HTML code." },
            { role: "user", content: prompt }
          ],
        })
      });
      
      if (openRouterRes.ok) {
        const data = await openRouterRes.json();
        generatedHtml = data.choices[0].message.content.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();
      }
    } catch (apiErr) {
      console.warn("API error:", apiErr);
    }
    
    let htmlContent = generatedHtml || "<html><body><h1>Card</h1></body></html>";
    const fileKey = `generations/${job.id}/index.html`;
    const shareLink = await uploadHtmlToR2(htmlContent, fileKey, env);
    
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: 'succeeded', actualCreditCost: cost, shareLink }
    });
    
    return NextResponse.json({ result: 'success', shareLink });
  } catch (error: any) {
    console.error('Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
with open(path, 'w') as f:
    f.write(content)
