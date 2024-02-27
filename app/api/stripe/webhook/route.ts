import { NextResponse } from "next/server";
import { z } from "zod";
import { createStripeClient } from "@/lib/stripe.server";
import http from "@/lib/http-status-codes";
import { env } from "@/lib/env.server";
import { supabaseWithServiceRoleForServer } from "@/lib/supabase.server";
import { revalidatePath } from "next/cache";

export const dynamic = 'force-dynamic';




export async function POST(req: Request) {
  const supabase = supabaseWithServiceRoleForServer;
  const stripe = createStripeClient();
  const reqText = await req.text();

  const stripeSignature = z.string().parse(req.headers.get("Stripe-Signature"));
  const event = await stripe.webhooks.constructEventAsync(reqText, stripeSignature, env.STRIPE_WEBHOOK_SIGNING_SECRET);

  try {
    console.info("Stripe webhook event:", event.type);

    switch (event.type) {


      // NOTE: Occurs whenever a new customer is created.
      case 'customer.created': {
        const customer = z.object({
          id: z.string(),
          metadata: z.object({
            user_id: z.string(),
          }),
        }).parse(event.data.object);

        await supabase
          .from("stripe_customers")
          .insert([{
            user_id: customer.metadata.user_id,
            stripe_id: customer.id,
          }])
          .throwOnError();

        break;
      }


      case 'customer.deleted': {
        const customer = z.object({
          id: z.string(),
        }).parse(event.data.object);

        await supabase
          .from("stripe_customers")
          .delete()
          .eq("stripe_Id", customer.id)
          .throwOnError();

        break;
      }


      // NOTE: Occurs whenever a customer is signed up for a new plan.
      case 'customer.subscription.created': {
        const subscription = z.object({
          id: z.string(),
          status: z.enum(['incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid']),
          customer: z.string(),
          items: z.object({
            data: z.array(
              z.object({
                price: z.object({
                  id: z.string(),
                }),
              }),
            ),
          }),
          metadata: z.object({
            user_id: z.string(),
          }),
        }).parse(event.data.object);


        cancel_existing_subscriptions: {
          const result = await supabase
            .from("stripe_subscriptions")
            .delete()
            .eq("stripe_customer_id", subscription.customer)
            .select()
            .maybeSingle();

          if (result.error) {
            console.error(result.error.message);
            return internal_server_error_response;
          }

          const existingSubscription = result.data;

          if (existingSubscription) {
            await stripe.subscriptions.cancel(existingSubscription.stripe_id);
          }
        }

        await supabase
          .from("stripe_subscriptions")
          .insert([{
            stripe_id: subscription.id,
            stripe_price_id: subscription.items.data[0].price.id,
            stripe_customer_id: subscription.customer,
            user_id: subscription.metadata.user_id,
          }])
          .throwOnError();

        break;
      }



      // NOTE: Occurs whenever a customer’s subscription ends.
      case 'customer.subscription.deleted': {
        const subscription = z.object({
          id: z.string(),
        }).parse(event.data.object);

        await supabase
          .from("stripe_subscriptions")
          .update({
            deleted_at: new Date().toISOString(),
            latest_period_end_at: new Date().toISOString(),
            next_payment_at: null,
          })
          .eq("stripe_id", subscription.id)
          .throwOnError();

        break;
      }


      // NOTE: Occurs whenever a subscription changes (e.g., switching from one plan to another, or changing the status from trial to active).
      case 'customer.subscription.updated': {
        const subscription = z.object({
          id: z.string(),
          cancel_at_period_end: z.boolean(),
          status: z.enum(['incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid']),
          canceled_at: z.number().nullable(),
          customer: z.string(),
          items: z.object({
            data: z.array(
              z.object({
                price: z.object({
                  id: z.string(),
                }),
              }),
            ),
          }),
          metadata: z.object({
            user_id: z.string(),
          }),
        }).parse(event.data.object);


        let nextPaymentAt; {
          const result = await supabase
            .from("stripe_subscriptions")
            .select("next_payment_at")
            .eq("stripe_id", subscription.id)
            .single();

          if (result.error) {
            console.error(result.error.message);
            throw internal_server_error_response;
          }

          nextPaymentAt = result.data.next_payment_at;
        }

        await supabase
          .from("stripe_subscriptions")
          .update({
            stripe_customer_id: subscription.customer,
            user_id: subscription.metadata.user_id,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1_000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            next_payment_at: subscription.cancel_at_period_end ? null : undefined,
            subscription_end_at: subscription.cancel_at_period_end && nextPaymentAt ? new Date(nextPaymentAt).toISOString() : undefined,
          })
          .eq("stripe_id", subscription.id)
          .throwOnError();

        break;
      }


      // NOTE: Occurs whenever an invoice payment attempt succeeds.
      case 'invoice.payment_succeeded': {
        const invoice = z.object({
          status: z.string(),
          customer: z.string(),
          lines: z.object({
            data: z.array(
              z.object({
                period: z.object({
                  end: z.number(),
                  start: z.number(),
                }),
                price: z.object({
                  id: z.string(),
                }),
              }),
            ),
          }),
          id: z.string(),
          subscription_details: z.object({
            metadata: z.object({
              user_id: z.string(),
            }),
          }),
        }).parse(event.data.object);

        const lineItem = invoice.lines.data[0];

        // TODO: next_payment_at and last_payment_at should be replaced with the latest_period_start_at and latest_period_end_at across the app.
        // --- viktor.tar, 2024-02-11
        await supabase
          .from("stripe_subscriptions")
          .update({
            next_payment_at: new Date(lineItem.period.end * 1_000).toISOString(),
            last_payment_at: new Date(lineItem.period.start * 1_000).toISOString(),
            latest_period_start_at: new Date(lineItem.period.start * 1_000).toISOString(),
            latest_period_end_at: new Date(lineItem.period.end * 1_000).toISOString(),
            cancel_at_period_end: false,
          })
          .eq("user_id", invoice.subscription_details.metadata.user_id)
          .throwOnError();

        break;
      }

      default: {
        console.error(`Unhandled event type ${event.type}`);
        return internal_server_error_response;
      }

    }

    revalidatePath("/");
    return NextResponse.json({}, { status: http.OK });

  } catch (error: unknown) {
    console.info(event.data.object);
    console.error(error);
    return internal_server_error_response;
  }
};




const internal_server_error_response = NextResponse.json({ message: "Internal server error" }, { status: http.INTERNAL_SERVER_ERROR });