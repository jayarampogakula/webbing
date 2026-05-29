import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma, SubscriptionStatus } from "@webbing/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET environment variable.");
    return new NextResponse("Stripe configuration error", { status: 500 });
  }

  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Stripe Webhook Signature Verification Failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const tenantId = session.metadata?.tenantId;
        if (!tenantId) {
          console.warn("Stripe Checkout completed without tenantId metadata.");
          break;
        }

        const subscriptionId = session.subscription as string;
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

        await prisma.subscription.upsert({
          where: { tenantId },
          update: {
            status: SubscriptionStatus.ACTIVE,
            planId: stripeSubscription.items.data[0].price.id,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            creditsLimit: 50, // Set basic starter credits quota
          },
          create: {
            tenantId,
            status: SubscriptionStatus.ACTIVE,
            planId: stripeSubscription.items.data[0].price.id,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            creditsLimit: 50,
          }
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscriptionId = session.id as string;
        const tenantRecord = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId }
        });

        if (!tenantRecord) {
          console.warn(`No local subscription found matching Stripe ID: ${subscriptionId}`);
          break;
        }

        await prisma.subscription.update({
          where: { id: tenantRecord.id },
          data: {
            status: session.status === "active" ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PAST_DUE,
            planId: session.items.data[0].price.id,
            currentPeriodStart: new Date(session.current_period_start * 1000),
            currentPeriodEnd: new Date(session.current_period_end * 1000),
            cancelAtPeriodEnd: session.cancel_at_period_end,
          }
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscriptionId = session.id as string;
        const tenantRecord = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId }
        });

        if (tenantRecord) {
          await prisma.subscription.update({
            where: { id: tenantRecord.id },
            data: {
              status: SubscriptionStatus.CANCELED,
            }
          });
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe Webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Stripe Webhook Processing Error:", err);
    return new NextResponse("Webhook Processing Exception", { status: 500 });
  }
}
