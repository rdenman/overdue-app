/**
 * Create Household Modal
 * Modal component for creating new households
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModalContainer } from '@/components/ui/modal-container';
import { useCreateHousehold } from '@/lib/hooks/use-households';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

interface CreateHouseholdModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export function CreateHouseholdModal({
  visible,
  onClose,
  userId,
}: CreateHouseholdModalProps) {
  const [householdName, setHouseholdName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const createHouseholdMutation = useCreateHousehold();

  // Focus input when modal becomes visible
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [visible]);

  const handleCreate = async () => {
    const trimmedName = householdName.trim();

    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a household name');
      return;
    }

    if (trimmedName.length < 3) {
      Alert.alert('Error', 'Household name must be at least 3 characters');
      return;
    }

    if (trimmedName.length > 50) {
      Alert.alert('Error', 'Household name must be less than 50 characters');
      return;
    }

    try {
      await createHouseholdMutation.mutateAsync({
        name: trimmedName,
        ownerId: userId,
      });

      setHouseholdName('');
      onClose();
    } catch (error: any) {
      console.error('Error creating household:', error);
      Alert.alert('Error', error.message || 'Failed to create household');
    }
  };

  const handleCancel = () => {
    setHouseholdName('');
    onClose();
  };

  const loading = createHouseholdMutation.isPending;

  return (
    <ModalContainer
      visible={visible}
      onClose={handleCancel}
      title="Create Household"
      estimatedHeight={300}
    >
      <Input
        ref={inputRef}
        label="Household Name"
        value={householdName}
        onChangeText={setHouseholdName}
        placeholder="e.g., Family, Roommates, Office"
        maxLength={50}
        editable={!loading}
        containerStyle={styles.inputContainer}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Cancel"
          variant="outlined"
          onPress={handleCancel}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <Button
          title="Create"
          onPress={handleCreate}
          loading={loading}
          disabled={loading}
          style={{ flex: 1 }}
        />
      </View>
    </ModalContainer>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
});
