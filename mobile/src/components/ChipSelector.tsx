// Member 2 – Item Management
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';

type Props<T extends string> = {
  label: string;
  options: readonly T[];
  selected: T | null;
  onSelect: (option: T) => void;
  getLabel?: (option: T) => string;
};

export function ChipSelector<T extends string>({
  label,
  options,
  selected,
  onSelect,
  getLabel = (option) => option,
}: Props<T>) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const checked = selected === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [styles.chip, checked && styles.selected, pressed && styles.pressed]}
            >
              <Text style={[styles.text, checked && styles.selectedText]}>{getLabel(option)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 18 },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 9 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 12,
  },
  selected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  text: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  selectedText: { color: '#FFFFFF' },
  pressed: { opacity: 0.8 },
});