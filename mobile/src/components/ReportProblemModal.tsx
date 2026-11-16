// Member 1 – Problem reports
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';
import { reportService } from '../services/report.service';
import { getErrorMessage } from '../utils';
import { FormInput } from './FormInput';
import { MessageBanner } from './MessageBanner';
import { PrimaryButton } from './PrimaryButton';

interface ReportProblemModalProps {
  visible: boolean;
  /** Screen the user was on, sent with the report so the team can find the problem. */
  screen: string | null;
  onClose: () => void;
}

const MIN_LENGTH = 5;

/** Bottom sheet for describing a problem. Opened by shaking the phone or from Profile. */
export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({ visible, screen, onClose }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [banner, setBanner] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // Start fresh each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setMessage('');
      setBanner(null);
    }
  }, [visible]);

  const send = async () => {
    if (message.trim().length < MIN_LENGTH) {
      setBanner({ text: `Please describe the problem (at least ${MIN_LENGTH} characters).`, type: 'error' });
      return;
    }
    setIsSending(true);
    setBanner(null);
    try {
      await reportService.send(message.trim(), screen);
      setMessage('');
      setBanner({ text: 'Thanks! Your report was sent to the team.', type: 'success' });
    } catch (error) {
      // The text is kept so the user can try again.
      setBanner({ text: getErrorMessage(error, 'The report could not be sent. Please try again.'), type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const sent = banner?.type === 'success';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text style={styles.title}>Report a problem</Text>
          <Text style={styles.subtitle}>
            {screen ? `On screen: ${screen}. ` : ''}Tell us what went wrong and we'll look into it.
          </Text>

          <MessageBanner message={banner?.text ?? null} type={banner?.type} />

          {!sent ? (
            <>
              <FormInput
                label="What happened?"
                placeholder="e.g. The photo did not upload"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={1000}
                style={styles.input}
              />
              <PrimaryButton title="Send report" onPress={send} loading={isSending} />
            </>
          ) : null}
          <PrimaryButton
            title={sent ? 'Close' : 'Cancel'}
            variant="outlined"
            onPress={onClose}
            disabled={isSending}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, marginBottom: 16, lineHeight: 20 },
  input: { minHeight: 100, textAlignVertical: 'top' },
});
