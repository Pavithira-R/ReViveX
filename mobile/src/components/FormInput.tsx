import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { COLORS } from '../constants';

interface FormInputProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, required, error, style, ...props }) => (
  <View style={styles.container}>
    <Text style={styles.label}>
      {label}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
    <TextInput
      style={[styles.input, error ? styles.inputError : null, style]}
      placeholderTextColor={COLORS.textMuted}
      accessibilityLabel={label}
      {...props}
    />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  required: { color: COLORS.error },
  input: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 48,
  },
  inputError: { borderColor: COLORS.error },
  error: { color: COLORS.error, fontSize: 13, marginTop: 4 },
});
