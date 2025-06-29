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
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);

  const loadCurrentSubscription = useCallback(async () => {
    if (!user) {
      setSubscriptionLoading(false);
      return;
    }

    try {
      setSubscriptionLoading(true);
      
      const data = await withRetry(async () => {
        const { data, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();

        if (error) {
          const isJWTError = await handleSupabaseError(error);
          if (!isJWTError) throw error;
          return null;
        }

        return data;
      });

      setCurrentSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
      // Don't show error toast for subscription loading failures
      setCurrentSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }, [user, handleSupabaseError, withRetry]);

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
      toast.loading('Starting payment process...', { id: 'checkout' });

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
        toast.success('Redirecting to payment...', { id: 'checkout' });
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }

      return url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start payment process';
      toast.error(errorMessage, { id: 'checkout' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, isOnline]);

  const createPortalSession = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to manage billing');
      return;
    }

    if (!currentSubscription?.customer_id) {
      toast.error('No active subscription found');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Opening billing portal...', { id: 'portal' });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          return_url: `${window.location.origin}/settings`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const { url } = await response.json();
      
      if (url) {
        toast.success('Redirecting to billing portal...', { id: 'portal' });
        window.location.href = url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to open billing portal';
      toast.error(errorMessage, { id: 'portal' });
    } finally {
      setLoading(false);
    }
  }, [user, currentSubscription]);

  const isProUser = useCallback(() => {
    if (!currentSubscription) return false;
    
    const activeStatuses = ['active', 'trialing'];
    return activeStatuses.includes(currentSubscription.subscription_status);
  }, [currentSubscription]);

  const getSubscriptionStatus = useCallback(() => {
    if (!currentSubscription) return 'free';
    return currentSubscription.subscription_status;
  }, [currentSubscription]);

  const getCurrentPlan = useCallback(() => {
    if (!currentSubscription?.price_id) return null;
    
    const product = getProductByPriceId(currentSubscription.price_id);
    return product || null;
  }, [currentSubscription]);

  const getSubscriptionEndDate = useCallback(() => {
    if (!currentSubscription?.current_period_end) return null;
    return new Date(currentSubscription.current_period_end * 1000);
  }, [currentSubscription]);

  const isSubscriptionCanceling = useCallback(() => {
    return currentSubscription?.cancel_at_period_end || false;
  }, [currentSubscription]);

  useEffect(() => {
    if (user) {
      loadCurrentSubscription();
    } else {
      setCurrentSubscription(null);
      setSubscriptionLoading(false);
    }
  }, [user, loadCurrentSubscription]);

  return {
    loading,
    subscriptionLoading,
    currentSubscription,
    createCheckoutSession,
    createPortalSession,
    loadCurrentSubscription,
    isProUser,
    getSubscriptionStatus,
    getCurrentPlan,
    getSubscriptionEndDate,
    isSubscriptionCanceling,
    products: STRIPE_PRODUCTS,
  };
}