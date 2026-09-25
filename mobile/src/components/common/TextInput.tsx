import React from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  TextInputProps as RNTextInputProps,
} from 'react-native';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  characterCount?: number;
  maxCharacters?: number;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  helperText,
  characterCount,
  maxCharacters,
  style,
  ...rest
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          rest.multiline ? styles.multilineInput : null,
          style,
        ]}
        placeholderTextColor="#9CA3AF"
        {...rest}
      />
      <View style={styles.footerRow}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : helperText ? (
          <Text style={styles.helperText}>{helperText}</Text>
        ) : (
          <View />
        )}
        {maxCharacters !== undefined && characterCount !== undefined && (
          <Text style={styles.counterText}>
            {characterCount}/{maxCharacters}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.2,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  multilineInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 18,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
  },
  counterText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
