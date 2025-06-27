import { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    interval: 'month',
    features: [
      '5-minute video sessions',
      'Basic mood tracking',
      'Limited AI conversations',
      'Basic task management'
    ],
    stripePriceId: '',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 199,
    currency: 'INR',
    interval: 'month',
    features: [
      'Unlimited video sessions',
      'Advanced mood analytics',
      'Unlimited AI conversations',
      'Priority support',
      'Advanced task management',
      'Export data',
      'Custom AI personalities'
    ],
    stripePriceId: 'price_1QVxxxxxxxxxxx', // Replace with actual Stripe Price ID
  }
];

export function useStripe() {
  const { user, handleSupabaseError } = useAuth();
  const { isOnline, withRetry } = useNetworkStatus();
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  const loadCurrentSubscription = useCallback(async () => {
    if (!user) return;

    try {
      const data = await withRetry(async () => {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);

        if (error) {
          const isJWTError = await handleSupabaseError(error);
          if (!isJWTError) throw error;
          return null;
        }

        return data && data.length > 0 ? data[0] : null;
      });

      setCurrentSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  }, [user, withRetry, handleSupabaseError]);

  const createCheckoutSession = useCallback(async (planId: string) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return null;
    }

    if (!isOnline) {
      toast.error('Internet connection required for payment');
      return null;
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan || plan.id === 'free') {
      toast.error('Invalid subscription plan');
      return null;
    }

    try {
      setLoading(true);

      // Call your backend to create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw error;
      }

      return sessionId;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start payment process');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, isOnline]);

  const createPortalSession = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to manage subscription');
      return;
    }

    if (!isOnline) {
      toast.error('Internet connection required');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast.error('Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  }, [user, isOnline]);

  const updateSubscriptionStatus = useCallback(async (
    planType: string,
    isActive: boolean,
    expiresAt?: string
  ) => {
    if (!user) return;

    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            plan_type: planType,
            is_active: isActive,
            expires_at: expiresAt || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          const isJWTError = await handleSupabaseError(error);
          if (!isJWTError) throw error;
        }
      });

      await loadCurrentSubscription();
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  }, [user, withRetry, handleSupabaseError, loadCurrentSubscription]);

  const isProUser = useCallback(() => {
    return currentSubscription?.plan_type === 'pro' && currentSubscription?.is_active;
  }, [currentSubscription]);

  const getSubscriptionStatus = useCallback(() => {
    if (!currentSubscription) return 'free';
    
    if (currentSubscription.is_active) {
      return currentSubscription.plan_type;
    }
    
    return 'expired';
  }, [currentSubscription]);

  return {
    loading,
    currentSubscription,
    createCheckoutSession,
    createPortalSession,
    updateSubscriptionStatus,
    loadCurrentSubscription,
    isProUser,
    getSubscriptionStatus,
    plans: SUBSCRIPTION_PLANS,
  };
}