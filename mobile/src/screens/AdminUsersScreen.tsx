import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageBanner, PrimaryButton } from '../components';
import { COLORS, ROLE_LABELS } from '../constants';
import { useAuth } from '../context';
import { adminService } from '../services';
import { User, UserRole } from '../types';
import { getErrorMessage } from '../utils';

const ROLE_FILTERS: { value: UserRole | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'ITEM_OWNER', label: ROLE_LABELS.ITEM_OWNER },
  { value: 'SERVICE_PROVIDER', label: ROLE_LABELS.SERVICE_PROVIDER },
  { value: 'BUYER', label: ROLE_LABELS.BUYER },
  { value: 'RECYCLER', label: ROLE_LABELS.RECYCLER },
  { value: 'ADMIN', label: ROLE_LABELS.ADMIN },
];

interface AdminUsersScreenProps {
  onBack: () => void;
}

/** Admin-only list of users with search, role filter and activate/deactivate (US-37). */
export const AdminUsersScreen: React.FC<AdminUsersScreenProps> = ({ onBack }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await adminService.listUsers({
        search: search.trim() || undefined,
        role: roleFilter,
        limit: 50,
      });
      setUsers(result.items);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter]);

  // Reload when the role filter changes; search reloads on submit.
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const toggleActive = (target: User) => {
    const action = target.isActive ? 'Deactivate' : 'Activate';
    Alert.alert(`${action} account?`, `${action} ${target.name} (${target.email})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action,
        style: target.isActive ? 'destructive' : 'default',
        onPress: async () => {
          setBusyUserId(target.id);
          try {
            const updated = await adminService.setActive(target.id, !target.isActive);
            setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
          } catch (error) {
            setErrorMessage(getErrorMessage(error));
          } finally {
            setBusyUserId(null);
          }
        },
      },
    ]);
  };

  const renderUser = ({ item }: { item: User }) => {
    const isSelf = item.id === currentUser?.id;
    return (
      <View style={[styles.userCard, !item.isActive && styles.userCardInactive]}>
        <View style={styles.flex}>
          <Text style={styles.userName}>
            {item.name}
            {isSelf ? ' (you)' : ''}
          </Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userMeta}>
            {ROLE_LABELS[item.role]} · {item.isActive ? 'Active' : 'Deactivated'}
          </Text>
        </View>
        {!isSelf ? (
          <Pressable
            onPress={() => toggleActive(item)}
            disabled={busyUserId === item.id}
            accessibilityRole="button"
            style={[styles.toggle, item.isActive ? styles.toggleDanger : styles.toggleOk]}
          >
            {busyUserId === item.id ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={item.isActive ? styles.toggleDangerText : styles.toggleOkText}>
                {item.isActive ? 'Deactivate' : 'Activate'}
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topTitle}>Manage Users</Text>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          placeholder="Search name or email"
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadUsers}
          returnKeyType="search"
          autoCapitalize="none"
          accessibilityLabel="Search users"
        />
        <View style={styles.chips}>
          {ROLE_FILTERS.map(({ value, label }) => {
            const selected = roleFilter === value;
            return (
              <Pressable
                key={label}
                onPress={() => setRoleFilter(value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.listArea}>
        <MessageBanner message={errorMessage} />
        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" />
        ) : errorMessage && users.length === 0 ? (
          <PrimaryButton title="Retry" variant="outlined" onPress={loadUsers} />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUser}
            ListEmptyComponent={<Text style={styles.empty}>No users match these filters.</Text>}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

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
  filters: { padding: 16, paddingBottom: 8 },
  search: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 46,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.text },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  listArea: { flex: 1, paddingHorizontal: 16 },
  listContent: { paddingBottom: 24 },
  loader: { marginTop: 32 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 32, fontSize: 15 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  userCardInactive: { opacity: 0.65 },
  userName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  userEmail: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  userMeta: { fontSize: 13, color: COLORS.primary, marginTop: 4 },
  toggle: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 96,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  toggleDanger: { borderColor: COLORS.error },
  toggleOk: { borderColor: COLORS.primary },
  toggleDangerText: { color: COLORS.error, fontWeight: '600' },
  toggleOkText: { color: COLORS.primary, fontWeight: '600' },
});

export default AdminUsersScreen;
