import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { COLORS, RADIUS } from '../constants';
import { AppIcon } from './AppIcon';

/** What a ref to FormInput points at (call .focus() on it). */
export type TextInputHandle = React.ComponentRef<typeof TextInput>;

interface FormInputProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
}

/**
 * Labelled text input used on every form.
 * Password fields (secureTextEntry) get an eye button to show / hide what was typed.
 * Forwards its ref, so a form can move to the next field with the keyboard's "Next" key.
 */
export const FormInput = forwardRef<TextInputHandle, FormInputProps>(
  ({ label, required, error, style, onFocus, onBlur, secureTextEntry, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const isPassword = !!secureTextEntry;

    return (
      <View style={styles.container}>
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
        <View>
          <TextInput
            ref={ref}
            style={[
              styles.input,
              isPassword && styles.inputWithButton,
              isFocused && styles.inputFocused,
              error ? styles.inputError : null,
              style,
            ]}
            placeholderTextColor={COLORS.textMuted}
            accessibilityLabel={label}
            secureTextEntry={isPassword && !isVisible}
            autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
            onFocus={(event) => {
              setIsFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setIsFocused(false);
              onBlur?.(event);
            }}
            {...props}
          />
          {isPassword ? (
            <Pressable
              onPress={() => setIsVisible((visible) => !visible)}
              accessibilityRole="button"
              accessibilityLabel={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
              hitSlop={10}
              style={styles.eyeButton}
            >
              <AppIcon name={isVisible ? 'eye-off-outline' : 'eye-outline'} size={22} color={COLORS.textMuted} />
            </Pressable>
          ) : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }
);

FormInput.displayName = 'FormInput';

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  required: { color: COLORS.error },
  input: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 50,
  },
  inputWithButton: { paddingRight: 48 },
  inputFocused: { borderColor: COLORS.primary, borderWidth: 1.5, backgroundColor: COLORS.surfaceMuted },
  inputError: { borderColor: COLORS.error },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  error: { color: COLORS.error, fontSize: 13, marginTop: 4 },
});
