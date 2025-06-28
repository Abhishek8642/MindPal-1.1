import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { supabase } from '../lib/supabase';
import { STRIPE_PRODUCTS, getProductByPriceId } from '../stripe-config';
import toast from 'react-hot-toast';

interface SubscriptionData {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export function useStripe() {
  const { user, handleSupabaseError } = useAuth();
  const { isOnline, withRetry } = useNetworkStatus();
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);

  const loadCurrentSubscription = useCallback(async () => {
    if (!user) return;

    // Temporarily disable subscription loading to prevent resource exhaustion
    console.log('Stripe subscription loading disabled - database view not configured');
    setCurrentSubscription(null);
    return;

    /* 
    // This code is disabled until the stripe_user_subscriptions view is properly created
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        if (error.code === '42P01') {
          console.warn('Stripe subscription view not found - subscription features disabled');
          setCurrentSubscription(null);
          return;
        }
        
        const isJWTError = await handleSupabaseError(error);
        if (!isJWTError) {
          console.warn('Error loading subscription:', error);
        }
        setCurrentSubscription(null);
        return;
      }

      setCurrentSubscription(data);
    } catch (error) {
      console.warn('Error loading subscription:', error);
      setCurrentSubscription(null);
    }
    */
  }, [user, handleSupabaseError]);

  const createCheckoutSession = useCallback(async (productId: string) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return null;
    }

    if (!isOnline) {
      toast.error('Internet connection required for payment');
      return null;
    }

    const product = STRIPE_PRODUCTS.find(p => p.id === productId);
    if (!product) {
      toast.error('Invalid product selected');
      return null;
    }

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: product.priceId,
          mode: product.mode,
          success_url: `${window.location.origin}/dashboard?success=true`,
          cancel_url: `${window.location.origin}/dashboard?canceled=true`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }

      return url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start payment process');
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

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  }, [user, isOnline]);

  const isProUser = useCallback(() => {
    // Since subscription loading is disabled, default to false
    return false;
  }, []);

  const getSubscriptionStatus = useCallback(() => {
    // Since subscription loading is disabled, default to free
    return 'free';
  }, []);

  const getCurrentPlan = useCallback(() => {
    // Since subscription loading is disabled, return null
    return null;
  }, []);

  useEffect(() => {
    if (user) {
      // Don't load subscription data to prevent resource exhaustion
      console.log('Subscription loading skipped - database not configured');
    }
  }, [user]);

  return {
    loading,
    currentSubscription,
    createCheckoutSession,
    createPortalSession,
    loadCurrentSubscription,
    isProUser,
    getSubscriptionStatus,
    getCurrentPlan,
    products: STRIPE_PRODUCTS,
  };
}