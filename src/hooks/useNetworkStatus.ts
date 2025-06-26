import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface NetworkStatus {
  isOnline: boolean;
  isConnectedToSupabase: boolean;
  lastChecked: Date | null;
  retryCount: number;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isConnectedToSupabase: true,
    lastChecked: null,
    retryCount: 0,
  });

  const checkSupabaseConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.warn('Supabase connection check failed:', error);
      return false;
    }
  }, []);

  const updateNetworkStatus = useCallback(async () => {
    const isOnline = navigator.onLine;
    let isConnectedToSupabase = false;

    if (isOnline) {
      isConnectedToSupabase = await checkSupabaseConnection();
    }

    setNetworkStatus(prev => ({
      ...prev,
      isOnline,
      isConnectedToSupabase,
      lastChecked: new Date(),
    }));

    return { isOnline, isConnectedToSupabase };
  }, [checkSupabaseConnection]);

  const retryConnection = useCallback(async () => {
    setNetworkStatus(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
    }));

    const status = await updateNetworkStatus();
    
    if (status.isOnline && status.isConnectedToSupabase) {
      toast.success('Connection restored!');
      setNetworkStatus(prev => ({ ...prev, retryCount: 0 }));
    }

    return status;
  }, [updateNetworkStatus]);

  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check network status before attempting operation
        if (!networkStatus.isOnline) {
          throw new Error('No internet connection');
        }

        const result = await operation();
        
        // Reset retry count on success
        if (attempt > 0) {
          setNetworkStatus(prev => ({ ...prev, retryCount: 0 }));
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Update network status if this looks like a network error
        if (error instanceof TypeError && error.message.includes('fetch')) {
          await updateNetworkStatus();
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError!;
  }, [networkStatus.isOnline, updateNetworkStatus]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      updateNetworkStatus();
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnectedToSupabase: false,
        lastChecked: new Date(),
      }));
      toast.error('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    updateNetworkStatus();

    // Periodic health check every 30 seconds
    const interval = setInterval(updateNetworkStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [updateNetworkStatus]);

  return {
    ...networkStatus,
    updateNetworkStatus,
    retryConnection,
    withRetry,
  };
}