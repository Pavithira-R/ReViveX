import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ChipSelector from '../components/ChipSelector';
import FormInput from '../components/FormInput';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { api, type Category, type CreateItemPayload, type ItemAction, type ItemCondition } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'PostItem'>;

const CONDITIONS: ItemCondition[] = ['WORKING', 'DAMAGED', 'BROKEN'];
const ACTIONS: ItemAction[] = ['REPAIR', 'REUSE', 'SELL', 'DONATE', 'RECYCLE'];

export default function PostItemScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('WORKING');
  const [action, setAction] = useState<ItemAction>('REUSE');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.categories.getAll()
      .then((result) => {
        if (active) {
          setCategories(result);
          setCategoryId(result[0]?.id ?? null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load categories.');
        }
      })
      .finally(() => {
        if (active) {
          setLoadingCategories(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const pickImages = async () => {
    if (images.length >= 5) {
      Alert.alert('Image limit reached', 'You can add up to 5 images.');
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Allow photo library access to choose item images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
        quality: 0.85,
      });
      if (!result.canceled) {
        setImages((current) => [...current, ...result.assets].slice(0, 5));
      }
    } catch (pickerError) {
      Alert.alert(
        'Could not select images',
        pickerError instanceof Error ? pickerError.message : 'Please try again.',
      );
    }
  };

  const retryCategories = async () => {
    setLoadingCategories(true);
    setError(null);
    try {
      const result = await api.categories.getAll();
      setCategories(result);
      setCategoryId(result[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load categories.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const submit = async () => {
    if (!name.trim() || !categoryId) {
      Alert.alert('Missing information', 'Enter an item name and select a category.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateItemPayload = {
        name: name.trim(),
        brand: brand.trim() || undefined,
        condition,
        action,
        description: description.trim() || undefined,
        categoryId,
      };
      const createdItem = await api.items.create(payload);
      if (images.length > 0) {
        try {
          await api.items.uploadImages(
            createdItem.id,
            images.map((image, index) => ({
              uri: image.uri,
              name: image.fileName ?? `item-image-${index + 1}.jpg`,
              type: image.mimeType ?? 'image/jpeg',
            })),
          );
        } catch (uploadError) {
          Alert.alert(
            'Item posted without photos',
            uploadError instanceof Error ? uploadError.message : 'The selected photos could not be uploaded.',
            [{ text: 'OK', onPress: () => navigation.goBack() }],
          );
          return;
        }
      }
      Alert.alert('Item posted', 'Your item has been added.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (submitError) {
      Alert.alert(
        'Could not post item',
        submitError instanceof Error ? submitError.message : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Add a few details to help your item find its next chapter.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Photos (up to 5)</Text>
          <ScrollView horizontal contentContainerStyle={styles.imageRow} showsHorizontalScrollIndicator={false}>
            {images.map((image, index) => (
              <View key={`${image.uri}-${index}`} style={styles.previewWrap}>
                <Image source={{ uri: image.uri }} style={styles.preview} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove image ${index + 1}`}
                  onPress={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                  style={styles.removeImage}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </Pressable>
              </View>
            ))}
            <Pressable accessibilityRole="button" onPress={() => void pickImages()} style={styles.pickButton}>
              <Text style={styles.pickIcon}>+</Text>
              <Text style={styles.pickText}>Add photos</Text>
            </Pressable>
          </ScrollView>
        </View>

        <FormInput
          autoCapitalize="words"
          label="Item name"
          onChangeText={setName}
          placeholder="e.g. Wireless headphones"
          returnKeyType="next"
          value={name}
        />
        <FormInput
          autoCapitalize="words"
          label="Brand (optional)"
          onChangeText={setBrand}
          placeholder="e.g. Sony"
          returnKeyType="next"
          value={brand}
        />

        {loadingCategories ? (
          <ActivityIndicator color="#2E7D32" style={styles.loading} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void retryCategories()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <ChipSelector
            getLabel={(id) => categories.find((category) => category.id === id)?.name ?? id}
            label="Category"
            onSelect={setCategoryId}
            options={categories.map((category) => category.id)}
            selected={categoryId}
          />
        )}

        <ChipSelector label="Condition" onSelect={setCondition} options={CONDITIONS} selected={condition} />
        <ChipSelector label="Action" onSelect={setAction} options={ACTIONS} selected={action} />
        <FormInput
          label="Description (optional)"
          multiline
          numberOfLines={4}
          onChangeText={setDescription}
          placeholder="Describe the item and its condition"
          style={styles.description}
          textAlignVertical="top"
          value={description}
        />

        <Pressable
          accessibilityRole="button"
          disabled={submitting || loadingCategories || Boolean(error)}
          onPress={() => void submit()}
          style={({ pressed }) => [
            styles.postButton,
            (pressed || submitting) && styles.buttonPressed,
            (submitting || loadingCategories || Boolean(error)) && styles.buttonDisabled,
          ]}
        >
          {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.postButtonText}>Post item</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  intro: {
    color: '#687269',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 25,
  },
  fieldGroup: {
    marginBottom: 22,
  },
  fieldLabel: {
    color: '#273329',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  imageRow: {
    alignItems: 'center',
    gap: 10,
  },
  previewWrap: {
    position: 'relative',
  },
  preview: {
    backgroundColor: '#EAF0EA',
    borderRadius: 12,
    height: 88,
    width: 88,
  },
  removeImage: {
    alignItems: 'center',
    backgroundColor: '#263126',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: -6,
    top: -6,
    width: 24,
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
  },
  pickButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE5DD',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 88,
    justifyContent: 'center',
    width: 102,
  },
  pickIcon: {
    color: '#2E7D32',
    fontSize: 22,
    fontWeight: '500',
  },
  pickText: {
    color: '#687269',
    fontSize: 11,
    marginTop: 2,
  },
  loading: {
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: '#FDECEC',
    borderRadius: 10,
    marginBottom: 20,
    padding: 12,
  },
  errorText: {
    color: '#A22929',
    fontSize: 13,
  },
  retryText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  description: {
    minHeight: 110,
  },
  postButton: {
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 54,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
