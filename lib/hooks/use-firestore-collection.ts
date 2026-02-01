/**
 * useFirestoreCollection hook
 * Real-time subscription to a Firestore collection query
 */

import {
  FirestoreError,
  Query,
  onSnapshot,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export interface UseFirestoreCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
}

export function useFirestoreCollection<T>(
  queryRef: Query<T> | null
): UseFirestoreCollectionResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!queryRef) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => doc.data());
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore collection subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [queryRef]);

  return { data, loading, error };
}
