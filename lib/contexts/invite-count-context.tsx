/**
 * Invite Count Context
 * Manages the pending invite count across the app
 */

import { getPendingInvitesForEmail } from '@/lib/services/invite-service';
import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

interface InviteCountContextType {
  count: number;
  refreshCount: () => Promise<void>;
  isLoading: boolean;
}

const InviteCountContext = createContext<InviteCountContextType | undefined>(undefined);

interface InviteCountProviderProps {
  children: React.ReactNode;
  userEmail: string | null;
}

export function InviteCountProvider({ children, userEmail }: InviteCountProviderProps) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    if (!userEmail) {
      setCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const invites = await getPendingInvitesForEmail(userEmail);
      setCount(invites.length);
    } catch (error) {
      console.error('Error loading invite count:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return (
    <InviteCountContext.Provider value={{ count, refreshCount, isLoading }}>
      {children}
    </InviteCountContext.Provider>
  );
}

export function useInviteCount() {
  const context = useContext(InviteCountContext);
  if (context === undefined) {
    throw new Error('useInviteCount must be used within an InviteCountProvider');
  }
  return context;
}
