// Member 2 – Item Management
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChipSelector, FormInput, MessageBanner, PrimaryButton } from '../components';
import { COLORS } from '../constants';
import { requestCapability } from '../services';
import { itemService } from '../services/item.service';
import { Category, CreateItemPayload, ItemAction, ItemCondition } from '../types';
import { getErrorMessage } from '../utils';

interface PostItemScreenProps {
  onBack: () => void;
  onPosted: (itemId: string) => void;
}

const conditions: ItemCondition[] = ['WORKING', 'DAMAGED', 'BROKEN'];
const actions: ItemAction[] = ['REPAIR', 'REUSE', 'SELL', 'DONATE', 'RECYCLE'];

export const PostItemScreen: React.FC<PostItemScreenProps> = ({ onBack, onPosted }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('WORKING');
  const [action, setAction] = useState<ItemAction>('REUSE');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<Asset[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [postedItemId, setPostedItemId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setErrorMessage(null);
    try {
      const result = await itemService.categories();
      setCategories(result);
      setCategoryId((current) => current ?? result[0]?.id ?? null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not load item categories.'));
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addPhotos = async (selected: Asset[]) => {
    const availableSlots = 5 - photos.length;
    setPhotos((current) => [...current, ...selected.filter((photo) => !!photo.uri).slice(0, availableSlots)]);
  };

  const pickPhotos = async () => {
    setPhotoError(null);
    if (photos.length >= 5) {
      setPhotoError('You can add up to 5 photos.');
      return;
    }

    if (await requestCapability('camera') === 'available') {
      try {
        const cameraResult = await launchCamera({
          mediaType: 'photo',
          quality: 0.6,
          maxWidth: 800,
          maxHeight: 800,
          includeBase64: true,
        });
        if (cameraResult.assets?.length) {
          await addPhotos(cameraResult.assets);
          return;
        }
        if (cameraResult.didCancel) return;
      } catch {
        // A missing camera or camera launch error falls back to the gallery.
      }
    }

    try {
      const galleryResult = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.6,
        selectionLimit: 5 - photos.length,
        maxWidth: 800,
        maxHeight: 800,
        includeBase64: true,
      });
      if (galleryResult.assets?.length) await addPhotos(galleryResult.assets);
    } catch {
      setPhotoError('Could not open the gallery. You can still post without a photo.');
    }
  };

  const submit = async () => {
    if (!name.trim() || !categoryId) {
      setErrorMessage('Enter an item name and choose a category.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    setPostedItemId(null);
    try {
      const payload: CreateItemPayload = {
        name: name.trim(),
        brand: brand.trim() || undefined,
        condition,
        action,
        description: description.trim() || undefined,
        categoryId,
      };
      const item = await itemService.create(payload);
      const files = photos.map((photo) => photo.base64).filter((base64): base64 is string => !!base64);
      if (files.length > 0) {
        try {
          await itemService.uploadPhotos(item.id, files);
        } catch {
          setPostedItemId(item.id);
          setErrorMessage('Item posted, but the photo could not be uploaded. You can open the item or try again later.');
          return;
        }
      }
      onPosted(item.id);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not post this item.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topTitle}>Post an Item</Text>
        <View style={styles.topSpacer} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>Give your device a useful next step.</Text>
          <MessageBanner message={errorMessage} />
          <MessageBanner message={photoError} />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Photos ({photos.length}/5)</Text>
            <ScrollView horizontal contentContainerStyle={styles.photoRow} showsHorizontalScrollIndicator={false}>
              {photos.map((photo, index) => (
                <View key={`${photo.uri}-${index}`} style={styles.photoWrap}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove photo ${index + 1}`}
                    onPress={() => setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))}
                    style={styles.removePhoto}
                  >
                    <Text style={styles.removeText}>×</Text>
                  </Pressable>
                </View>
              ))}
              {photos.length < 5 ? (
                <Pressable accessibilityRole="button" onPress={pickPhotos} style={styles.addPhoto}>
                  <Text style={styles.addPhotoIcon}>+</Text>
                  <Text style={styles.addPhotoText}>Camera / gallery</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </View>

          <FormInput label="Item name" required value={name} onChangeText={setName} placeholder="e.g. Wireless headphones" autoCapitalize="words" />
          <FormInput label="Brand" value={brand} onChangeText={setBrand} placeholder="Optional" autoCapitalize="words" />

          {isLoadingCategories ? (
            <ActivityIndicator color={COLORS.primary} style={styles.loader} />
          ) : categories.length ? (
            <ChipSelector
              label="Category"
              options={categories.map((category) => category.id)}
              selected={categoryId}
              onSelect={setCategoryId}
              getLabel={(id) => categories.find((category) => category.id === id)?.name ?? id}
            />
          ) : (
            <PrimaryButton title="Retry loading categories" variant="outlined" onPress={loadCategories} />
          )}

          <ChipSelector label="Condition" options={conditions} selected={condition} onSelect={setCondition} />
          <ChipSelector label="Action" options={actions} selected={action} onSelect={setAction} />
          <FormInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the device and its condition"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.description}
          />
          {postedItemId ? (
            <PrimaryButton title="Open posted item" variant="outlined" onPress={() => onPosted(postedItemId)} />
          ) : null}
          <PrimaryButton title="Post item" onPress={submit} loading={isSubmitting} disabled={isLoadingCategories || !categories.length} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  topBar: { alignItems: 'center', backgroundColor: COLORS.surface, borderBottomColor: COLORS.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  back: { color: COLORS.primary, fontSize: 16, fontWeight: '600', minWidth: 60 },
  topTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  topSpacer: { minWidth: 60 },
  content: { padding: 20, paddingBottom: 36 },
  intro: { color: COLORS.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 18 },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  photoRow: { alignItems: 'center', gap: 10, paddingVertical: 5 },
  photoWrap: { position: 'relative' },
  photo: { backgroundColor: COLORS.primaryLight, borderRadius: 8, height: 82, width: 82 },
  removePhoto: { alignItems: 'center', backgroundColor: COLORS.text, borderRadius: 12, height: 24, justifyContent: 'center', position: 'absolute', right: -5, top: -5, width: 24 },
  removeText: { color: '#FFFFFF', fontSize: 18, lineHeight: 22 },
  addPhoto: { alignItems: 'center', backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, height: 82, justifyContent: 'center', width: 112 },
  addPhotoIcon: { color: COLORS.primary, fontSize: 22, fontWeight: '500' },
  addPhotoText: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  loader: { marginVertical: 20 },
  description: { minHeight: 104 },
});

export default PostItemScreen;