export const runtime = 'edge';

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPrismaClient } from '@/lib/prisma';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  });

  const prisma = getPrismaClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Webhook verification failed';
    console.error(`Webhook signature verification failed.`, errMsg);
    return NextResponse.json({ error: errMsg }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || '0', 10);

    if (userId && credits) {
      const order = await prisma.paymentOrder.findUnique({ where: { stripeCheckoutSessionId: session.id } });
      if (order && order.status === 'created') {
        await prisma.paymentOrder.update({
          where: { stripeCheckoutSessionId: session.id },
          data: { status: 'paid', paidAt: new Date() }
        });
        
        await prisma.creditWallet.upsert({
          where: { userId },
          update: { balance: { increment: credits } },
          create: { userId, balance: credits }
        });

        await prisma.creditTransaction.create({
          data: {
            userId,
            type: 'purchase',
            amount: credits,
            status: 'completed',
            referenceType: 'payment',
            referenceId: order.id,
          }
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
