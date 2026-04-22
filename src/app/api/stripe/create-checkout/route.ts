import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { amountHkd, credits } = await req.json();

    // Mock userId for prototype
    const userId = "mock-user-id";

    // Ensure user exists in db for prototype
    let user = await prisma.user.findUnique({ where: { email: "test@example.com" } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: "test@example.com",
          passwordHash: "mock-hash",
        }
      });
      await prisma.creditWallet.create({
        data: { userId, balance: 20 }
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'hkd',
            product_data: {
              name: `SyncHeartist ${credits} 點`,
            },
            unit_amount: amountHkd * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/?payment_canceled=true`,
      metadata: {
        userId,
        credits: credits.toString(),
      },
    });

    // Log the order in DB
    await prisma.paymentOrder.create({
      data: {
        userId,
        stripeCheckoutSessionId: session.id,
        amountHkd,
        creditsToGrant: credits,
        status: 'created',
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
