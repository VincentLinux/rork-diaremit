import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { Filter, Download, Search } from "lucide-react-native";
import { useTransfer } from "@/providers/TransferProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";

export default function HistoryScreen() {
  const { recentTransfers } = useTransfer();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'SEK': return 'sek ';
      case 'NOK': return 'nok ';
      case 'DKK': return 'dkk ';
      default: return '$';
    }
  };

  const filteredTransfers = recentTransfers.filter(transfer => {
    if (filter === 'all') return true;
    if (filter === 'sent') return transfer.type === 'sent';
    if (filter === 'received') return transfer.type === 'received';
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}>
      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterTab, { backgroundColor: filter === 'all' ? colors.primary : colors.backgroundSecondary }, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, { color: filter === 'all' ? '#fff' : colors.textSecondary }, filter === 'all' && styles.filterTextActive]}>
              {t('all')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, { backgroundColor: filter === 'sent' ? colors.primary : colors.backgroundSecondary }, filter === 'sent' && styles.filterTabActive]}
            onPress={() => setFilter('sent')}
          >
            <Text style={[styles.filterText, { color: filter === 'sent' ? '#fff' : colors.textSecondary }, filter === 'sent' && styles.filterTextActive]}>
              {t('sent')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, { backgroundColor: filter === 'received' ? colors.primary : colors.backgroundSecondary }, filter === 'received' && styles.filterTabActive]}
            onPress={() => setFilter('received')}
          >
            <Text style={[styles.filterText, { color: filter === 'received' ? '#fff' : colors.textSecondary }, filter === 'received' && styles.filterTextActive]}>
              {t('received')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredTransfers.length > 0 ? (
          <View style={styles.monthSection}>
            <Text style={[styles.monthHeader, { color: colors.textSecondary }]}>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            
            {filteredTransfers.map((transfer) => (
              <TouchableOpacity
                key={transfer.id}
                style={[styles.transactionCard, { backgroundColor: colors.card }]}
                onPress={() => router.push({
                  pathname: "/transaction-details",
                  params: { id: transfer.id }
                })}
              >
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: transfer.type === 'sent' ? '#FEE2E2' : '#D1FAE5' }
                  ]}>
                    <Text style={styles.transactionEmoji}>
                      {transfer.type === 'sent' ? '↗️' : '↘️'}
                    </Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionName, { color: colors.text }]}>{transfer.recipient_name}</Text>
                    <Text style={[styles.transactionDetails, { color: colors.textSecondary }]}>
                      {transfer.country} • {transfer.date}
                    </Text>
                    <View style={styles.statusBadge}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(transfer.status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(transfer.status) }]}>
                        {t(transfer.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[
                    styles.transactionAmount,
                    { color: transfer.type === 'sent' ? '#EF4444' : '#10B981' }
                  ]}>
                    {transfer.type === 'sent' ? '-' : '+'}
                    {getCurrencySymbol(transfer.source_currency)}{transfer.amount}
                  </Text>
                  <Text style={[styles.transactionFee, { color: colors.textSecondary }]}>
                    {t('fee')}: {getCurrencySymbol(transfer.source_currency)}{transfer.fee || '2.99'}
                  </Text>
                  {transfer.target_currency && transfer.target_currency !== transfer.source_currency && (
                    <Text style={[styles.targetCurrency, { color: colors.textSecondary }]}>
                      → {transfer.target_currency}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {t('noTransactionsYet') || 'No transactions yet'}
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
              {t('startSendingMoney') || 'Start sending money to see your transaction history here'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/recipients')}
            >
              <Text style={styles.emptyStateButtonText}>{t('sendMoney') || 'Send Money'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
  },
  filterTabActive: {},
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {},

  monthSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  monthHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  transactionCard: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDetails: {
    fontSize: 13,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionFee: {
    fontSize: 12,
  },
  targetCurrency: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});