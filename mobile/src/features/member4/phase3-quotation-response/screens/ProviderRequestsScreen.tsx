import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RepairRequest, RepairStatus } from '../../types';
import { mobileQuotationService } from '../quotationService';
import { QuotationModal } from '../components/QuotationModal';
import { Card, MessageBanner, PrimaryButton, StatusBadge } from '../../../../components';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../../../../constants';

interface ProviderRequestsScreenProps {
  providerId?: string;
  onNavigateToTracking?: (request: RepairRequest) => void;
  onBack?: () => void;
}

type FilterTab = 'ALL' | 'REQUESTED' | 'ACCEPTED' | 'REJECTED';

export const ProviderRequestsScreen: React.FC<ProviderRequestsScreenProps> = ({
  providerId = 'prov_fixit_001',
  onNavigateToTracking,
  onBack,
}) => {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [selectedRequestForModal, setSelectedRequestForModal] = useState<RepairRequest | null>(null);

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await mobileQuotationService.getIncomingRequests(providerId);
      if (res.success && res.data) {
        setRequests(res.data);
      } else {
        setError(res.error || 'Failed to load repair requests');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [providerId]);

  const handleModalSubmit = async (payload: {
    action: 'ACCEPT' | 'REJECT';
    estimatedPrice?: number;
    providerNotes?: string;
    rejectionReason?: string;
  }) => {
    if (!selectedRequestForModal) return;

    const res = await mobileQuotationService.submitResponse(selectedRequestForModal.id, payload);
    if (res.success && res.data) {
      // Update local request state
      setRequests((prev) =>
        prev.map((r) => (r.id === res.data?.id ? res.data : r))
      );
    } else {
      throw new Error(res.error || 'Failed to update request');
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeFilter === 'ALL') return true;
    return r.status === activeFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        {onBack ? (
          <Pressable onPress={onBack} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
        ) : (
          <View style={styles.topSpacer} />
        )}
        <Text style={styles.topTitle} numberOfLines={1}>
          Repair Requests
        </Text>
        <View style={styles.topSpacer} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        {(['ALL', 'REQUESTED', 'ACCEPTED', 'REJECTED'] as FilterTab[]).map((tab) => {
          const isSelected = activeFilter === tab;
          return (
            <Pressable
              key={tab}
              style={[styles.tabButton, isSelected && styles.activeTabButton]}
              onPress={() => setActiveFilter(tab)}
            >
              <Text style={[styles.tabText, isSelected && styles.activeTabText]}>
                {tab === 'REQUESTED' ? 'Pending' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorBox}>
          <MessageBanner message={error} />
          <PrimaryButton title="Try again" variant="outlined" onPress={loadRequests} />
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Requests Found</Text>
              <Text style={styles.emptySubtitle}>
                No customer requests in this category at this moment.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deviceTitle}>{item.itemSummary?.title || item.itemName || 'Electronic Device'}</Text>
                  <Text style={styles.customerName}>Customer: {item.customerSummary?.name || item.customerName || 'Customer'}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <Text style={styles.descriptionLabel}>Problem Description:</Text>
              <Text style={styles.descriptionText} numberOfLines={3}>
                {item.problem || item.problemDescription}
              </Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  📅 Preferred: {item.preferredDate ? item.preferredDate.substring(0, 10) : 'Flexible'} ({item.preferredTime || 'Anytime'})
                </Text>
              </View>

              {item.estimatedPrice !== undefined && (
                <View style={styles.quoteSummaryRow}>
                  <Text style={styles.quoteLabel}>Quoted Estimate:</Text>
                  <Text style={styles.quotePrice}>${item.estimatedPrice.toFixed(2)} USD</Text>
                </View>
              )}

              {item.rejectionReason && (
                <View style={styles.rejectReasonBox}>
                  <Text style={styles.rejectReasonLabel}>Decline Reason: {item.rejectionReason}</Text>
                </View>
              )}

              <View style={styles.cardActions}>
                {item.status === RepairStatus.REQUESTED ? (
                  <PrimaryButton
                    title="Review & Send Quotation"
                    onPress={() => setSelectedRequestForModal(item)}
                  />
                ) : (
                  <PrimaryButton
                    title="View Status & Track Progress →"
                    variant="outlined"
                    onPress={() => onNavigateToTracking?.(item)}
                  />
                )}
              </View>
            </Card>
          )}
        />
      )}

      {/* Modal for Accept/Reject & Quotation */}
      <QuotationModal
        visible={Boolean(selectedRequestForModal)}
        request={selectedRequestForModal}
        onClose={() => setSelectedRequestForModal(null)}
        onSubmit={handleModalSubmit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  back: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    minWidth: 60,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
    textAlign: 'center',
  },
  topSpacer: {
    minWidth: 60,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  loader: {
    marginTop: 40,
  },
  errorBox: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  requestCard: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  deviceTitle: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  customerName: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  descriptionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  descriptionText: {
    fontSize: FONT.xs,
    color: COLORS.text,
    marginTop: 2,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  metaText: {
    fontSize: FONT.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },
  quoteSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.sm,
    padding: SPACING.xs + 2,
    marginTop: SPACING.xs,
  },
  quoteLabel: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
  },
  quotePrice: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  rejectReasonBox: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.sm,
    padding: SPACING.xs + 2,
    marginTop: SPACING.xs,
  },
  rejectReasonLabel: {
    fontSize: FONT.xs,
    color: COLORS.danger,
    fontWeight: '600',
  },
  cardActions: {
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
