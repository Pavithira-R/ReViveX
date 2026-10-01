import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormInput, MessageBanner, PrimaryButton } from '../components';
import { COLORS, ROLE_LABELS } from '../constants';
import { useAuth } from '../context';
import { getErrorMessage } from '../utils';

interface ProfileScreenProps {
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  if (!user) return null;

  const startEditing = () => {
    setName(user.name);
    setPhone(user.phone ?? '');
    setMessage(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage({ text: 'Name cannot be empty.', type: 'error' });
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() || null });
      setMessage({ text: 'Profile updated.', type: 'success' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ text: getErrorMessage(error), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topTitle}>My Profile</Text>
        <View style={styles.topSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || '?'}</Text>
            </View>
            <Text style={styles.name}>{user.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{ROLE_LABELS[user.role]}</Text>
            </View>
          </View>

          <MessageBanner message={message?.text ?? null} type={message?.type} />

          {isEditing ? (
            <View>
              <FormInput label="Full name" required value={name} onChangeText={setName} />
              <FormInput
                label="Phone number"
                placeholder="+94 77 123 4567"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Text style={styles.hint}>Email and role can't be changed here.</Text>
              <PrimaryButton title="Save Changes" onPress={handleSave} loading={isSaving} />
              <PrimaryButton
                title="Cancel"
                variant="outlined"
                onPress={() => setIsEditing(false)}
                disabled={isSaving}
              />
            </View>
          ) : (
            <View>
              <View style={styles.card}>
                <ProfileRow label="Email" value={user.email} />
                <ProfileRow label="Phone" value={user.phone || 'Not added'} />
                <ProfileRow label="Role" value={ROLE_LABELS[user.role]} />
                <ProfileRow
                  label="Member since"
                  value={new Date(user.createdAt).toLocaleDateString()}
                  last
                />
              </View>
              <PrimaryButton title="Edit Profile" onPress={startEditing} />
              <PrimaryButton title="Log Out" variant="danger" onPress={logout} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const ProfileRow: React.FC<{ label: string; value: string; last?: boolean }> = ({
  label,
  value,
  last,
}) => (
  <View style={[styles.row, !last && styles.rowDivider]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: { fontSize: 16, color: COLORS.primary, fontWeight: '600', minWidth: 60 },
  topTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  topSpacer: { minWidth: 60 },
  content: { padding: 20 },
  identity: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: COLORS.primary },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  roleBadge: {
    marginTop: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleBadgeText: { color: COLORS.primaryDark, fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  row: { paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel: { fontSize: 13, color: COLORS.textMuted },
  rowValue: { fontSize: 16, color: COLORS.text, marginTop: 2 },
  hint: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
});

export default ProfileScreen;
