/**
 * Invite Member Screen
 * Screen for sending household invitations
 */

import { InviteMemberModal } from '@/components/invite-member-modal';
import { useAuth } from '@/lib/hooks/use-auth';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

export default function InviteMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show modal when screen mounts
    setVisible(true);
  }, []);

  const handleClose = () => {
    setVisible(false);
    // Navigate back after modal closes
    setTimeout(() => {
      router.back();
    }, 300);
  };

  const handleSuccess = () => {
    // Modal will close and navigate back
  };

  if (!id || !user) {
    return null;
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Invite Member',
          presentation: 'modal',
          headerBackTitle: 'Households',
        }} 
      />
      <InviteMemberModal
        visible={visible}
        onClose={handleClose}
        onSuccess={handleSuccess}
        householdId={id}
        userId={user.uid}
      />
    </>
  );
}
