/**
 * useAuth hook
 * Provides easy access to authentication state
 */

import { useAuthContext } from '../contexts/auth-context';

export function useAuth() {
  return useAuthContext();
}
