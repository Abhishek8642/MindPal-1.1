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

  // COMPLETELY DISABLED - No subscription loading at all
  const loadCurrentSubscription = useCallback(async () => {
    console.log('Stripe subscription loading completely disabled');
    setCurrentSubscription(null);
    return;
  }, []);

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
    toast.error('Billing portal not available - subscription features disabled');
    return;
  }, []);

  // Always return false since subscription loading is disabled
  const isProUser = useCallback(() => {
    return false;
  }, []);

  const getSubscriptionStatus = useCallback(() => {
    return 'free';
  }, []);

  const getCurrentPlan = useCallback(() => {
    return null;
  }, []);

  // NO useEffect - completely prevent any automatic loading
  // useEffect removed to prevent any subscription loading attempts

  return {
    loading,
    currentSubscription: null, // Always null
    createCheckoutSession,
    createPortalSession,
    loadCurrentSubscription,
    isProUser,
    getSubscriptionStatus,
    getCurrentPlan,
    products: STRIPE_PRODUCTS,
  };
}