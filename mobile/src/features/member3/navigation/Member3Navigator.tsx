// ============================================================================
// Member 3 - Feature Navigator (Smart Recommendation & Discovery)
// Stateful local navigator coordinating all Member 3 screens & cross-member handoffs
// ============================================================================

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  Member3Route,
  RecommendationResult,
  SearchFilters,
  ServiceProviderSummary,
  ListingSummary,
  RecyclePointSummary,
} from '../types';
import { DiscoveryHomeScreen } from '../screens/DiscoveryHomeScreen';
import { RecommendationQuestionnaireScreen } from '../screens/RecommendationQuestionnaireScreen';
import { RecommendationResultScreen } from '../screens/RecommendationResultScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SearchResultsScreen } from '../screens/SearchResultsScreen';

export interface Member3NavigatorProps {
  /**
   * Cross-member handoff to Member 4 (Repair & Service Providers)
   */
  onNavigateToModule4?: (providerId?: string, category?: string) => void;

  /**
   * Cross-member handoff to Member 5 (Marketplace, Donation & Recycling)
   */
  onNavigateToModule5?: (
    actionType: 'SELL' | 'DONATE' | 'REUSE' | 'RECYCLE',
    draft?: any
  ) => void;

  /**
   * Cross-member handoff to Member 2 (Item Inventory Management)
   */
  onNavigateToModule2?: (itemDraft?: any) => void;

  /**
   * Optional callback to navigate back to parent app/tab
   */
  onNavigateBack?: () => void;
}

export const Member3Navigator: React.FC<Member3NavigatorProps> = ({
  onNavigateToModule4,
  onNavigateToModule5,
  onNavigateToModule2,
  onNavigateBack: _onNavigateBack,
}) => {
  const [currentRoute, setCurrentRoute] = useState<Member3Route>('DISCOVERY_HOME');
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResult | null>(
    null
  );
  const [activeSearchFilters, setActiveSearchFilters] = useState<SearchFilters>({
    page: 1,
    limit: 10,
  });

  // Handoff to Member 4 (Repair)
  const handleSelectProvider = (provider: ServiceProviderSummary) => {
    if (onNavigateToModule4) {
      onNavigateToModule4(provider.id);
    } else {
      Alert.alert(
        'Service Provider Selected',
        `Provider: ${provider.businessName}\nRating: ${provider.rating}★\nStarting: $${provider.startingPrice}\n\n[Member 4 Hand-off Triggered]`,
        [{ text: 'OK' }]
      );
    }
  };

  // Handoff to Member 5 (Listings / Marketplace)
  const handleSelectListing = (listing: ListingSummary) => {
    if (onNavigateToModule5) {
      onNavigateToModule5(listing.actionType, listing);
    } else {
      Alert.alert(
        'Listing Selected',
        `Item: ${listing.title}\nAction: ${listing.actionType}\nPrice: $${listing.price || 0}\n\n[Member 5 Hand-off Triggered]`,
        [{ text: 'OK' }]
      );
    }
  };

  // Handoff to Member 5 (Recycling Points)
  const handleSelectRecyclePoint = (point: RecyclePointSummary) => {
    if (onNavigateToModule5) {
      onNavigateToModule5('RECYCLE', point);
    } else {
      Alert.alert(
        'E-Waste Point Selected',
        `Kiosk: ${point.name}\nAddress: ${point.address}\n\n[Member 5 Hand-off Triggered]`,
        [{ text: 'OK' }]
      );
    }
  };

  // Primary Action CTA from Recommendation Result Screen
  const handlePrimaryActionHandoff = (action: string, result: RecommendationResult) => {
    switch (action) {
      case 'REPAIR':
        if (onNavigateToModule4) {
          onNavigateToModule4(undefined, 'LAPTOP');
        } else {
          // Fallback: switch to search filtered by REPAIR
          setActiveSearchFilters({
            actionType: 'REPAIR',
            page: 1,
            limit: 10,
          });
          setCurrentRoute('SEARCH_RESULTS');
        }
        break;

      case 'SELL':
        if (onNavigateToModule5) {
          onNavigateToModule5('SELL', { title: result.title });
        } else {
          setActiveSearchFilters({
            actionType: 'SELL',
            page: 1,
            limit: 10,
          });
          setCurrentRoute('SEARCH_RESULTS');
        }
        break;

      case 'DONATE':
        if (onNavigateToModule5) {
          onNavigateToModule5('DONATE', { title: result.title });
        } else {
          setActiveSearchFilters({
            actionType: 'DONATE',
            page: 1,
            limit: 10,
          });
          setCurrentRoute('SEARCH_RESULTS');
        }
        break;

      case 'RECYCLE':
        if (onNavigateToModule5) {
          onNavigateToModule5('RECYCLE');
        } else {
          setActiveSearchFilters({
            actionType: 'RECYCLE',
            page: 1,
            limit: 10,
          });
          setCurrentRoute('SEARCH_RESULTS');
        }
        break;

      case 'REUSE':
      default:
        setActiveSearchFilters({
          actionType: 'REUSE',
          page: 1,
          limit: 10,
        });
        setCurrentRoute('SEARCH_RESULTS');
        break;
    }
  };

  // Save Device to Inventory (Member 2 handoff)
  const handleSaveToInventory = (result: RecommendationResult) => {
    const itemDraft = {
      title: result.title,
      estimatedCo2SavingsKg: result.estimatedCo2SavingsKg,
      evaluationId: result.evaluationId,
      primaryAction: result.primaryAction,
    };
    if (onNavigateToModule2) {
      onNavigateToModule2(itemDraft);
    } else {
      Alert.alert(
        'Saved to Items',
        `Device details prepared for inventory.\n\n[Member 2 Hand-off: Draft pre-populated with evaluationId ${result.evaluationId}]`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Discovery Home Screen */}
      {currentRoute === 'DISCOVERY_HOME' && (
        <DiscoveryHomeScreen
          onStartQuestionnaire={() => setCurrentRoute('QUESTIONNAIRE')}
          onNavigateToSearch={(query) => {
            setActiveSearchFilters({ query, page: 1, limit: 10 });
            setCurrentRoute('SEARCH');
          }}
          onSelectProvider={handleSelectProvider}
          onSelectListing={handleSelectListing}
          onSelectRecyclePoint={handleSelectRecyclePoint}
          onSeeAllProviders={() => {
            setActiveSearchFilters({ actionType: 'REPAIR', page: 1, limit: 10 });
            setCurrentRoute('SEARCH_RESULTS');
          }}
          onSeeAllListings={() => {
            setActiveSearchFilters({ actionType: 'ALL', page: 1, limit: 10 });
            setCurrentRoute('SEARCH_RESULTS');
          }}
        />
      )}

      {/* 2. Recommendation Questionnaire Screen */}
      {currentRoute === 'QUESTIONNAIRE' && (
        <RecommendationQuestionnaireScreen
          onComplete={(result) => {
            setRecommendationResult(result);
            setCurrentRoute('RECOMMENDATION_RESULT');
          }}
          onCancel={() => setCurrentRoute('DISCOVERY_HOME')}
        />
      )}

      {/* 3. Recommendation Result Screen */}
      {currentRoute === 'RECOMMENDATION_RESULT' && recommendationResult && (
        <RecommendationResultScreen
          result={recommendationResult}
          onPrimaryActionHandoff={handlePrimaryActionHandoff}
          onSelectProvider={handleSelectProvider}
          onSelectListing={handleSelectListing}
          onSelectRecyclePoint={handleSelectRecyclePoint}
          onSaveToInventory={handleSaveToInventory}
          onRetake={() => setCurrentRoute('QUESTIONNAIRE')}
          onGoHome={() => setCurrentRoute('DISCOVERY_HOME')}
        />
      )}

      {/* 4. Search Entry Screen */}
      {currentRoute === 'SEARCH' && (
        <SearchScreen
          initialQuery={activeSearchFilters.query || ''}
          onSearch={(filters) => {
            setActiveSearchFilters((prev) => ({ ...prev, ...filters, page: 1 }));
            setCurrentRoute('SEARCH_RESULTS');
          }}
          onBack={() => setCurrentRoute('DISCOVERY_HOME')}
        />
      )}

      {/* 5. Search Results Screen */}
      {currentRoute === 'SEARCH_RESULTS' && (
        <SearchResultsScreen
          initialFilters={activeSearchFilters}
          onSelectProvider={handleSelectProvider}
          onSelectListing={handleSelectListing}
          onSelectRecyclePoint={handleSelectRecyclePoint}
          onNavigateToQuestionnaire={() => setCurrentRoute('QUESTIONNAIRE')}
          onBack={() => setCurrentRoute('DISCOVERY_HOME')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
