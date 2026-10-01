import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props<T extends string> = {
  label: string;
  options: readonly T[];
  selected: T | null;
  onSelect: (option: T) => void;
  getLabel?: (option: T) => string;
};

export default function ChipSelector<T extends string>({
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
          const isSelected = selected === option;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              key={option}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.selectedChip,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.text, isSelected && styles.selectedText]}>{getLabel(option)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 22,
  },
  label: {
    color: '#273329',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE5DD',
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
  },
  selectedChip: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    color: '#4C574D',
    fontSize: 11,
    fontWeight: '700',
  },
  selectedText: {
    color: '#FFFFFF',
  },
});
