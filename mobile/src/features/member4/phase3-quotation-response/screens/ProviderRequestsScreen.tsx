import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RepairRequest, RepairStatus } from '../../../types';
import { mobileQuotationService } from '../quotationService';
import { QuotationModal } from '../components/QuotationModal';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../theme';
import { Header } from '../../../components/common/Header';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorState } from '../../../components/common/ErrorState';

interface ProviderRequestsScreenProps {
  providerId?: string;
  onNavigateToTracking?: (request: RepairRequest) => void;
}

type FilterTab = 'ALL' | 'POSTED' | 'ACCEPTED' | 'REJECTED';

export const ProviderRequestsScreen: React.FC<ProviderRequestsScreenProps> = ({
  providerId = 'prov_fixit_001',
  onNavigateToTracking,
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

  const getStatusBadge = (status: RepairStatus) => {
    switch (status) {
      case RepairStatus.POSTED:
      case RepairStatus.MATCHED:
        return <Badge label="NEW REQUEST" variant="warning" size="sm" />;
      case RepairStatus.ACCEPTED:
        return <Badge label="QUOTED / ACCEPTED" variant="success" size="sm" />;
      case RepairStatus.REJECTED:
        return <Badge label="DECLINED" variant="danger" size="sm" />;
      case RepairStatus.IN_PROGRESS:
        return <Badge label="IN REPAIR" variant="info" size="sm" />;
      case RepairStatus.COMPLETED:
        return <Badge label="COMPLETED" variant="success" size="sm" />;
      default:
        return <Badge label={status} variant="neutral" size="sm" />;
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeFilter === 'ALL') return true;
    return r.status === activeFilter;
  });

  return (
    <View style={styles.container}>
      <Header
        title="Incoming Repair Requests"
        subtitle="Provider Dashboard & Quotation Management"
      />

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        {(['ALL', 'POSTED', 'ACCEPTED', 'REJECTED'] as FilterTab[]).map((tab) => {
          const isSelected = activeFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isSelected && styles.activeTabButton]}
              onPress={() => setActiveFilter(tab)}
            >
              <Text style={[styles.tabText, isSelected && styles.activeTabText]}>
                {tab === 'POSTED' ? 'Pending' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading incoming customer requests..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadRequests} />
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
                <View>
                  <Text style={styles.deviceTitle}>{item.itemSummary?.title || 'Electronic Device'}</Text>
                  <Text style={styles.customerName}>Customer: {item.customerSummary?.name || 'Customer'}</Text>
                </View>
                {getStatusBadge(item.status)}
              </View>

              <Text style={styles.descriptionLabel}>Problem Description:</Text>
              <Text style={styles.descriptionText} numberOfLines={3}>
                {item.problemDescription}
              </Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>📅 Preferred: {item.preferredDate.substring(0, 10)} ({item.preferredTime})</Text>
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
                {item.status === RepairStatus.POSTED ? (
                  <Button
                    title="Review & Send Quotation"
                    variant="primary"
                    size="sm"
                    onPress={() => setSelectedRequestForModal(item)}
                    style={styles.fullWidthBtn}
                  />
                ) : (
                  <Button
                    title="View Status & Track Progress →"
                    variant="outline"
                    size="sm"
                    onPress={() => onNavigateToTracking?.(item)}
                    style={styles.fullWidthBtn}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.xs,
  },
  tabButton: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSubtle,
  },
  activeTabButton: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.medium,
  },
  activeTabText: {
    color: Colors.textWhite,
    fontWeight: Typography.fontWeights.bold,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  requestCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  deviceTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  customerName: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  descriptionLabel: {
    fontSize: 11,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metaText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
  },
  quoteSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    padding: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  quoteLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.success,
    fontWeight: Typography.fontWeights.bold,
  },
  quotePrice: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primaryDark,
  },
  rejectReasonBox: {
    backgroundColor: Colors.dangerLight,
    padding: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  rejectReasonLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.danger,
  },
  cardActions: {
    marginTop: Spacing.xs,
  },
  fullWidthBtn: {
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
