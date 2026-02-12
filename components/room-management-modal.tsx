/**
 * Room Management Modal
 * Modal for managing household rooms (create, edit, delete)
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModalContainer } from '@/components/ui/modal-container';
import { Typography } from '@/components/ui/typography';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  useCreateRoom,
  useDeleteRoom,
  useHouseholdRooms,
} from '@/lib/hooks/use-rooms';
import { updateRoom } from '@/lib/services/room-service';
import { Room } from '@/lib/types/room';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

interface RoomManagementModalProps {
  visible: boolean;
  onClose: () => void;
  householdId: string;
}

export function RoomManagementModal({
  visible,
  onClose,
  householdId,
}: RoomManagementModalProps) {
  const { user } = useAuth();
  const { data: rooms = [] } = useHouseholdRooms(householdId);
  const createRoomMutation = useCreateRoom();
  const deleteRoomMutation = useDeleteRoom();

  const [newRoomName, setNewRoomName] = useState('');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState('');

  const handleCreateRoom = async () => {
    const trimmedName = newRoomName.trim();

    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }

    if (trimmedName.length > 50) {
      Alert.alert('Error', 'Room name must be less than 50 characters');
      return;
    }

    try {
      await createRoomMutation.mutateAsync({
        householdId,
        name: trimmedName,
        isDefault: false,
      });
      setNewRoomName('');
    } catch (error: any) {
      console.error('Error creating room:', error);
      Alert.alert('Error', error.message || 'Failed to create room');
    }
  };

  const handleStartEdit = (room: Room) => {
    setEditingRoomId(room.id);
    setEditingRoomName(room.name);
  };

  const handleSaveEdit = async (roomId: string) => {
    const trimmedName = editingRoomName.trim();

    if (!trimmedName) {
      Alert.alert('Error', 'Room name cannot be empty');
      return;
    }

    if (trimmedName.length > 50) {
      Alert.alert('Error', 'Room name must be less than 50 characters');
      return;
    }

    try {
      await updateRoom(householdId, roomId, {
        name: trimmedName,
      });
      setEditingRoomId(null);
      setEditingRoomName('');
      // Trigger refetch by calling useHouseholdRooms' refetch
    } catch (error: any) {
      console.error('Error updating room:', error);
      Alert.alert('Error', error.message || 'Failed to update room');
    }
  };

  const handleCancelEdit = () => {
    setEditingRoomId(null);
    setEditingRoomName('');
  };

  const handleDeleteRoom = (room: Room) => {
    Alert.alert(
      'Delete Room',
      `Delete "${room.name}"? All chores in this room will also be deleted. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await deleteRoomMutation.mutateAsync({
                householdId,
                roomId: room.id,
                requestingUserId: user.uid,
              });
            } catch (error: any) {
              console.error('Error deleting room:', error);
              Alert.alert('Error', error.message || 'Failed to delete room');
            }
          },
        },
      ]
    );
  };

  const loading =
    createRoomMutation.isPending ||
    deleteRoomMutation.isPending;

  return (
    <ModalContainer
      visible={visible}
      onClose={onClose}
      title="Manage Rooms"
      maxHeight={600}
    >
      <ScrollView style={styles.content}>
        {/* Existing rooms list */}
        <View style={styles.section}>
          <Typography variant="label" style={styles.sectionTitle}>
            Rooms
          </Typography>
          {rooms.map((room) => (
            <View key={room.id} style={styles.roomRow}>
              {editingRoomId === room.id ? (
                <>
                  <Input
                    value={editingRoomName}
                    onChangeText={setEditingRoomName}
                    style={styles.editInput}
                    maxLength={50}
                    autoFocus
                  />
                  <View style={styles.editActions}>
                    <Button
                      title="Save"
                      onPress={() => handleSaveEdit(room.id)}
                      size="sm"
                      disabled={loading}
                      style={styles.editButton}
                    />
                    <Button
                      title="Cancel"
                      onPress={handleCancelEdit}
                      variant="outlined"
                      size="sm"
                      disabled={loading}
                      style={styles.editButton}
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.roomInfo}>
                    <Typography variant="body" style={styles.roomName}>
                      {room.name}
                    </Typography>
                    {room.isDefault && (
                      <Typography variant="caption" muted>
                        (default)
                      </Typography>
                    )}
                  </View>
                  <View style={styles.roomActions}>
                    <Pressable
                      onPress={() => handleStartEdit(room)}
                      disabled={loading}
                      style={styles.actionButton}
                    >
                      <Typography variant="caption" style={styles.actionText}>
                        Edit
                      </Typography>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteRoom(room)}
                      disabled={loading}
                      style={styles.actionButton}
                    >
                      <Typography
                        variant="caption"
                        style={[styles.actionText, styles.deleteText]}
                      >
                        Delete
                      </Typography>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ))}
        </View>

        {/* Create new room section */}
        <View style={styles.section}>
          <Typography variant="label" style={styles.sectionTitle}>
            Add New Room
          </Typography>
          <View style={styles.createRow}>
            <Input
              value={newRoomName}
              onChangeText={setNewRoomName}
              placeholder="e.g. Garage, Office"
              style={styles.createInput}
              maxLength={50}
            />
            <Button
              title="Add"
              onPress={handleCreateRoom}
              size="sm"
              disabled={loading || !newRoomName.trim()}
              loading={createRoomMutation.isPending}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Done"
          onPress={onClose}
          variant="outlined"
          disabled={loading}
        />
      </View>
    </ModalContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  roomInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomName: {
    flex: 1,
  },
  roomActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  actionText: {
    color: '#3b82f6',
  },
  deleteText: {
    color: '#ef4444',
  },
  editInput: {
    flex: 1,
    marginRight: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    minWidth: 60,
  },
  createRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  createInput: {
    flex: 1,
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});
