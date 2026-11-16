// Member 1 – Problem reports (admin)
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageBanner, PrimaryButton } from '../components';
import { COLORS } from '../constants';
import { reportService } from '../services';
import { ProblemReport, ReportStatus } from '../types';
import { getErrorMessage } from '../utils';

interface ProblemReportsScreenProps {
  onBack: () => void;
}

const FILTERS: { label: string; status?: ReportStatus }[] = [
  { label: 'Open', status: 'OPEN' },
  { label: 'Resolved', status: 'RESOLVED' },
  { label: 'All' },
];

const formatWhen = (iso: string) => {
  const date = new Date(iso);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

/** Admin list of problems users reported (by shaking the phone or from Profile). */
export const ProblemReportsScreen: React.FC<ProblemReportsScreenProps> = ({ onBack }) => {
  const [filter, setFilter] = useState(FILTERS[0]);
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = useCallback(
    async (refreshing = false) => {
      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setErrorMessage(null);
      try {
        setReports(await reportService.adminList(filter.status));
      } catch (error) {
        setErrorMessage(getErrorMessage(error, 'Could not load reports.'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (report: ProblemReport) => {
    setResolvingId(report.id);
    try {
      const updated = await reportService.adminResolve(report.id);
      setReports((current) =>
        filter.status === 'OPEN'
          ? current.filter((r) => r.id !== report.id)
          : current.map((r) => (r.id === report.id ? updated : r))
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.topTitle}>Problem Reports</Text>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.filters}>
        {FILTERS.map((option) => (
          <Pressable
            key={option.label}
            onPress={() => setFilter(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: option === filter }}
            style={[styles.chip, option === filter && styles.chipActive]}
          >
            <Text style={[styles.chipText, option === filter && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />}
      >
        {isLoading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : null}
        <MessageBanner message={errorMessage} />
        {!isLoading && errorMessage && reports.length === 0 ? (
          <PrimaryButton title="Try again" variant="outlined" onPress={() => load()} />
        ) : null}
        {!isLoading && !errorMessage && reports.length === 0 ? (
          <Text style={styles.empty}>No {filter.status ? filter.label.toLowerCase() : ''} reports.</Text>
        ) : null}

        {reports.map((report) => (
          <View key={report.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.reporter}>{report.reporter.name}</Text>
              <Text style={[styles.status, report.status === 'OPEN' ? styles.open : styles.resolved]}>
                {report.status === 'OPEN' ? 'Open' : 'Resolved'}
              </Text>
            </View>
            <Text style={styles.message}>{report.message}</Text>
            <Text style={styles.meta}>
              {report.screen ? `Screen: ${report.screen} · ` : ''}
              {formatWhen(report.createdAt)}
            </Text>
            {report.status === 'OPEN' ? (
              <PrimaryButton
                title="Mark as resolved"
                variant="outlined"
                onPress={() => resolve(report)}
                loading={resolvingId === report.id}
              />
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: { fontSize: 16, color: COLORS.primary, fontWeight: '600', minWidth: 60 },
  topTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  topSpacer: { minWidth: 60 },
  filters: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  content: { padding: 20 },
  loader: { marginTop: 40 },
  empty: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reporter: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  status: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  open: { color: COLORS.error, backgroundColor: COLORS.errorBg },
  resolved: { color: COLORS.primaryDark, backgroundColor: COLORS.primaryLight },
  message: { fontSize: 15, color: COLORS.text, marginTop: 8, lineHeight: 21 },
  meta: { fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
});
