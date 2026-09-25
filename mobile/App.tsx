import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { ReviewListScreen } from './src/screens/ReviewListScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<'write' | 'list'>('write');
  const [testEmptyProvider, setTestEmptyProvider] = useState<boolean>(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>ReViveX</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Member 6 · Phase 1</Text>
          </View>
        </View>

        {/* Tab Toggle Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'write' && styles.activeTab]}
            onPress={() => setActiveTab('write')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'write' && styles.activeTabText,
              ]}
            >
              ✍ Write Review
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'list' && styles.activeTab]}
            onPress={() => setActiveTab('list')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'list' && styles.activeTabText,
              ]}
            >
              ★ Provider Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Testing Bar for Empty vs Populated Reviews */}
        {activeTab === 'list' && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !testEmptyProvider && styles.activeFilterChip,
              ]}
              onPress={() => setTestEmptyProvider(false)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !testEmptyProvider && styles.activeFilterChipText,
                ]}
              >
                Populated Provider Reviews
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                testEmptyProvider && styles.activeFilterChip,
              ]}
              onPress={() => setTestEmptyProvider(true)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  testEmptyProvider && styles.activeFilterChipText,
                ]}
              >
                Empty Provider (0 Reviews)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Screen Container */}
      <View style={styles.screenContainer}>
        {activeTab === 'write' ? (
          <ReviewScreen
            providerId="prov-tech-1"
            providerName="Lanka Electro Fix Solutions"
            serviceName="Motherboard & Screen Diagnostics"
            onSuccess={() => {
              // Optionally switch to list after submitting
            }}
          />
        ) : (
          <ReviewListScreen
            providerId={testEmptyProvider ? 'empty-provider-999' : 'prov-tech-1'}
            providerName={
              testEmptyProvider
                ? 'Colombo Green Recyclers (New)'
                : 'Lanka Electro Fix Solutions'
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669', // Emerald ReViveX green
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  activeFilterChip: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  filterChipText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#15803D',
    fontWeight: '700',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
});
