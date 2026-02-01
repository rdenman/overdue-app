/**
 * SyncContext - Offline sync status tracking
 * Monitors Firestore sync state and network connectivity
 * (Stub implementation for Phase 0, will be enhanced in later phases)
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Stub implementation - basic online/offline detection
  // Future phases will add Firestore snapshot listeners for sync status
  useEffect(() => {
    // For now, just assume we're always online
    // Real implementation would use network state and Firestore events
    setIsOnline(true);
    setLastSyncedAt(new Date());
  }, []);

  const value: SyncContextType = {
    isOnline,
    isSyncing,
    lastSyncedAt,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}
