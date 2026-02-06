/**
 * Network Status Hook
 * Provides real-time network connectivity status
 */

import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean>(true);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isConnected,
    isInternetReachable,
    isOnline: isConnected && isInternetReachable,
  };
}
