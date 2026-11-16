// Member 1 – Live password rules under a new-password field (green tick when met).
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';
import { AppIcon } from './AppIcon';

interface PasswordChecklistProps {
  password: string;
  /** Pass the confirmation field's value to also show "Passwords match". */
  confirmPassword?: string;
}

export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({ password, confirmPassword }) => {
  const rules = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a letter', met: /[A-Za-z]/.test(password) },
    { label: 'Contains a number', met: /\d/.test(password) },
  ];
  if (confirmPassword !== undefined) {
    rules.push({ label: 'Passwords match', met: password.length > 0 && password === confirmPassword });
  }

  return (
    <View style={styles.list} accessibilityLabel="Password requirements">
      {rules.map((rule) => (
        <View key={rule.label} style={styles.row}>
          <AppIcon
            name={rule.met ? 'check-circle' : 'circle-outline'}
            size={16}
            color={rule.met ? COLORS.success : COLORS.textMuted}
          />
          <Text style={[styles.text, rule.met && styles.textMet]}>{rule.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: { marginTop: -6, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  text: { fontSize: 13, color: COLORS.textMuted, marginLeft: 6 },
  textMet: { color: COLORS.success },
});
