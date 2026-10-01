import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  label: string;
};

export default function FormInput({ label, style, ...inputProps }: Props) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#98A098"
        style={[styles.input, style]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 20,
  },
  label: {
    color: '#273329',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 9,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE5DD',
    borderRadius: 12,
    borderWidth: 1,
    color: '#202820',
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
