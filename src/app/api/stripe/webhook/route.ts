import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const prisma = new PrismaClient();
// Usually we need STRIPE_WEBHOOK_SECRET to verify signature, but for the local prototype/MVP we will check securely if possible or mock the signature check if secret is not set.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // For local testing without secret
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || '0', 10);

    if (userId && credits) {
      await prisma.$transaction(async (tx) => {
        const order = await tx.paymentOrder.findUnique({ where: { stripeCheckoutSessionId: session.id } });
        if (order && order.status === 'created') {
          // 1. Update order
          await tx.paymentOrder.update({
            where: { stripeCheckoutSessionId: session.id },
            data: { status: 'paid', paidAt: new Date() }
          });
          
          // 2. Add credits
          await tx.creditWallet.upsert({
            where: { userId },
            update: { balance: { increment: credits } },
            create: { userId, balance: credits }
          });

          // 3. Log transaction
          await tx.creditTransaction.create({
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
      });
    }
  }

  return NextResponse.json({ received: true });
}
