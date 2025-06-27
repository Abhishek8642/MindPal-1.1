import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (request) => {
  const signature = request.headers.get('Stripe-Signature')

  // First, let's verify this is a valid request from Stripe
  // You'll need to add your webhook signing secret to your environment variables
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  
  if (!signature || !webhookSecret) {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  const body = await request.text()
  let receivedEvent
  
  try {
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message)
    return new Response(`Webhook signature verification failed.`, { status: 400 })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  console.log(`🔔 Webhook received: ${receivedEvent.type}`)

  // Handle the event
  switch (receivedEvent.type) {
    case 'checkout.session.completed': {
      const session = receivedEvent.data.object
      const userId = session.metadata?.userId

      if (userId && session.customer) {
        // Update user's subscription status
        await supabaseClient
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer,
            plan_type: 'pro',
            is_active: true,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          })

        console.log(`✅ Subscription activated for user ${userId}`)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = receivedEvent.data.object
      
      // Find user by Stripe customer ID
      const { data: userSubscription } = await supabaseClient
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', subscription.customer)
        .single()

      if (userSubscription) {
        const isActive = subscription.status === 'active'
        const expiresAt = new Date(subscription.current_period_end * 1000).toISOString()

        await supabaseClient
          .from('subscriptions')
          .update({
            is_active: isActive,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userSubscription.user_id)

        console.log(`✅ Subscription updated for user ${userSubscription.user_id}`)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = receivedEvent.data.object
      
      // Find user by Stripe customer ID
      const { data: userSubscription } = await supabaseClient
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', subscription.customer)
        .single()

      if (userSubscription) {
        await supabaseClient
          .from('subscriptions')
          .update({
            plan_type: 'free',
            is_active: false,
            expires_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userSubscription.user_id)

        console.log(`✅ Subscription cancelled for user ${userSubscription.user_id}`)
      }
      break
    }

    default:
      console.log(`Unhandled event type: ${receivedEvent.type}`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})