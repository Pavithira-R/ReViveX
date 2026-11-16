// Member 2 – Item Management
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionBadge, ChipSelector, FormInput, MessageBanner, PrimaryButton, StatusBadge } from '../components';
import { COLORS } from '../constants';
import { useAuth } from '../context';
import { itemService } from '../services';
import { Category, Item, ItemAction, ItemCondition } from '../types';
import { getErrorMessage } from '../utils';

interface ItemDetailsScreenProps {
  itemId: string;
  onBack: () => void;
}

const conditions: ItemCondition[] = ['WORKING', 'DAMAGED', 'BROKEN'];
const actions: ItemAction[] = ['REPAIR', 'REUSE', 'SELL', 'DONATE', 'RECYCLE'];

export const ItemDetailsScreen: React.FC<ItemDetailsScreenProps> = ({ itemId, onBack }) => {
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('WORKING');
  const [action, setAction] = useState<ItemAction>('REUSE');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await itemService.get(itemId);
      setItem(result);
      setName(result.name);
      setBrand(result.brand ?? '');
      setCondition(result.condition as ItemCondition);
      setAction(result.action as ItemAction);
      setDescription(result.description ?? '');
      setCategoryId(result.categoryId);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not load this item.'));
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    load();
  }, [load]);

  const beginEditing = async () => {
    setErrorMessage(null);
    try {
      setCategories(await itemService.categories());
      setIsEditing(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not load categories for editing.'));
    }
  };

  const save = async () => {
    if (!name.trim() || !categoryId) {
      setErrorMessage('Item name and category are required.');
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await itemService.update(itemId, {
        name: name.trim(),
        brand: brand.trim() || undefined,
        condition,
        action,
        description: description.trim() || undefined,
        categoryId,
      });
      setItem(updated);
      setIsEditing(false);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not save your changes.'));
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await itemService.remove(itemId);
      onBack();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not delete this item.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmRemove = () => {
    Alert.alert('Delete this item?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: remove },
    ]);
  };

  const isOwner = !!user && item?.ownerId === user.id;

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }
  if (!item) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}><BackButton onBack={onBack} /><Text style={styles.topTitle}>Item Details</Text><View style={styles.topSpacer} /></View>
        <View style={styles.centered}>
          <MessageBanner message={errorMessage ?? 'Item not found.'} />
          <PrimaryButton title="Try again" variant="outlined" onPress={load} />
        </View>
      </SafeAreaView>
    );
  }

  const date = new Date(item.createdAt);
  const postedDate = Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}><BackButton onBack={onBack} /><Text style={styles.topTitle}>Item Details</Text><View style={styles.topSpacer} /></View>
      <ScrollView contentContainerStyle={styles.content}>
        <MessageBanner message={errorMessage} />
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.placeholder]}><Text style={styles.placeholderText}>No photo</Text></View>
        )}
        {isEditing ? (
          <View style={styles.editForm}>
            <FormInput label="Item name" required value={name} onChangeText={setName} />
            <FormInput label="Brand" value={brand} onChangeText={setBrand} />
            <ChipSelector label="Category" options={categories.map((category) => category.id)} selected={categoryId} onSelect={setCategoryId} getLabel={(id) => categories.find((category) => category.id === id)?.name ?? id} />
            <ChipSelector label="Condition" options={conditions} selected={condition} onSelect={setCondition} />
            <ChipSelector label="Action" options={actions} selected={action} onSelect={setAction} />
            <FormInput label="Description" value={description} onChangeText={setDescription} multiline textAlignVertical="top" style={styles.descriptionInput} />
            <PrimaryButton title="Save changes" onPress={save} loading={isSaving} />
            <PrimaryButton title="Cancel" variant="outlined" onPress={() => setIsEditing(false)} disabled={isSaving} />
          </View>
        ) : (
          <>
            <Text style={styles.name}>{item.name}</Text>
            {item.brand ? <Text style={styles.brand}>by {item.brand}</Text> : null}
            <View style={styles.badges}><ActionBadge action={item.action} /><StatusBadge status={item.status} /></View>
            <View style={styles.info}>
              <DetailRow label="Category" value={item.category?.name ?? 'Uncategorized'} />
              <DetailRow label="Condition" value={item.condition.replaceAll('_', ' ')} />
              <DetailRow label="Posted by" value={item.owner?.name ?? 'Member'} />
              <DetailRow label="Posted" value={postedDate} />
            </View>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{item.description?.trim() || 'No description provided.'}</Text>
            {isOwner ? (
              <View style={styles.ownerActions}>
                <PrimaryButton title="Edit item" variant="outlined" onPress={beginEditing} />
                <PrimaryButton title="Delete item" variant="danger" onPress={confirmRemove} loading={isDeleting} />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

function BackButton({ onBack }: { onBack: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}><Text style={styles.back}>‹ Back</Text></Pressable>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  topBar: { alignItems: 'center', backgroundColor: COLORS.surface, borderBottomColor: COLORS.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  back: { color: COLORS.primary, fontSize: 16, fontWeight: '600', minWidth: 60 },
  topTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  topSpacer: { minWidth: 60 },
  content: { padding: 20, paddingBottom: 36 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  heroImage: { backgroundColor: COLORS.primaryLight, borderRadius: 10, height: 250, width: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  name: { color: COLORS.text, fontSize: 25, fontWeight: '700', marginTop: 18 },
  brand: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  info: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: 10, borderWidth: 1, marginTop: 20, paddingHorizontal: 14 },
  detailRow: { alignItems: 'center', borderBottomColor: COLORS.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 46 },
  detailLabel: { color: COLORS.textMuted, fontSize: 13 },
  detailValue: { color: COLORS.text, flexShrink: 1, fontSize: 13, fontWeight: '600', marginLeft: 12, textAlign: 'right' },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginTop: 22 },
  description: { color: COLORS.textMuted, fontSize: 14, lineHeight: 21, marginTop: 7 },
  ownerActions: { marginTop: 18 },
  editForm: { marginTop: 20 },
  descriptionInput: { minHeight: 100 },
});

export default ItemDetailsScreen;