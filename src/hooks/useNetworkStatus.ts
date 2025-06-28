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
      // Use a simpler endpoint that's more likely to work
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok || response.status === 401; // 401 is also acceptable (means server is responding)
    } catch (error) {
      console.warn('Supabase connection check failed:', error);
      return false;
    }
  }, []);

  const updateNetworkStatus = useCallback(async () => {
    const isOnline = navigator.onLine;
    let isConnectedToSupabase = true; // Default to true to prevent blocking

    if (isOnline) {
      try {
        isConnectedToSupabase = await checkSupabaseConnection();
      } catch (error) {
        console.warn('Network status check failed:', error);
        isConnectedToSupabase = true; // Assume connection is OK if check fails
      }
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
    maxRetries: number = 2,
    delay: number = 500
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Reset retry count on success
        if (attempt > 0) {
          setNetworkStatus(prev => ({ ...prev, retryCount: 0 }));
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Simple delay between retries
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        isConnectedToSupabase: true, // Assume connection is restored
        lastChecked: new Date(),
      }));
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnectedToSupabase: false,
        lastChecked: new Date(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check - but don't block if it fails
    updateNetworkStatus().catch(console.warn);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateNetworkStatus]);

  return {
    ...networkStatus,
    updateNetworkStatus,
    retryConnection,
    withRetry,
  };
}