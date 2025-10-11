import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Download, Share2, HelpCircle } from "lucide-react-native";
import { useTransfer } from "@/providers/TransferProvider";
import { useTheme } from "@/providers/ThemeProvider";

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { recentTransfers } = useTransfer();
  const { colors, isDark } = useTheme();
  
  const transaction = recentTransfers.find(t => t.id === id);
  
  if (!transaction) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}>
        <Text style={[{ color: colors.text }]}>Transaction not found</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[
          styles.statusCard,
          { backgroundColor: getStatusColor(transaction.status) + '10' }
        ]}>
          <View style={[
            styles.statusIcon,
            { backgroundColor: getStatusColor(transaction.status) }
          ]}>
            <Text style={styles.statusEmoji}>
              {transaction.status === 'completed' ? '✓' : 
               transaction.status === 'pending' ? '⏱' : '✗'}
            </Text>
          </View>
          <Text style={[
            styles.statusTitle,
            { color: getStatusColor(transaction.status) }
          ]}>
            Transfer {transaction.status}
          </Text>
          <Text style={[styles.statusAmount, { color: colors.text }]}>
            {transaction.source_currency || 'USD'} {transaction.amount}
          </Text>
          <Text style={[styles.statusDate, { color: colors.textSecondary }]}>
            {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : transaction.date}
          </Text>
        </View>

        {/* Transaction Details */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Transaction Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Transaction ID</Text>
            <Text style={[styles.detailValue, styles.transactionId, { color: colors.text }]}>TRX{id}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Recipient</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{transaction.recipient_name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Country</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{transaction.country}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Amount Sent</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {transaction.source_currency || 'USD'} {transaction.amount}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Transfer Fee</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {transaction.source_currency || 'USD'} {transaction.fee || '2.99'}
            </Text>
          </View>
          
          {transaction.payment_method && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Payment Method</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{transaction.payment_method}</Text>
            </View>
          )}
          
          {transaction.transfer_time && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Transfer Time</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{transaction.transfer_time}</Text>
            </View>
          )}
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabelBold, { color: colors.text }]}>Total Paid</Text>
            <Text style={[styles.detailValueBold, { color: colors.text }]}>
              {transaction.source_currency || 'USD'} {(parseFloat(String(transaction.amount)) + parseFloat(String(transaction.fee || '2.99'))).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={[styles.timelineCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Transaction Timeline</Text>
          
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineTitle, { color: colors.text }]}>Transfer Initiated</Text>
              <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>
                {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : `${transaction.date} at 10:30 AM`}
              </Text>
            </View>
          </View>
          
          {transaction.status !== 'failed' && (
            <View style={styles.timelineItem}>
              <View style={[
                styles.timelineDot,
                { backgroundColor: transaction.status === 'pending' ? '#E5E7EB' : '#10B981' }
              ]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.text }]}>Processing</Text>
                <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>
                  {transaction.status === 'pending' ? 'In progress...' : 
                   transaction.updated_at ? new Date(transaction.updated_at).toLocaleString() : `${transaction.date} at 10:45 AM`}
                </Text>
              </View>
            </View>
          )}
          
          {transaction.status === 'completed' && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.text }]}>Completed</Text>
                <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>
                  {transaction.updated_at ? new Date(transaction.updated_at).toLocaleString() : `${transaction.date} at 11:00 AM`}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Download size={20} color={isDark ? colors.primary : "#1B4B8C"} />
            <Text style={[styles.actionButtonText, { color: isDark ? colors.primary : "#1B4B8C" }]}>Download Receipt</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Share2 size={20} color={isDark ? colors.primary : "#1B4B8C"} />
            <Text style={[styles.actionButtonText, { color: isDark ? colors.primary : "#1B4B8C" }]}>Share Details</Text>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <TouchableOpacity style={[styles.supportCard, { backgroundColor: isDark ? colors.backgroundSecondary : '#EBF5FF' }]}>
          <HelpCircle size={20} color={isDark ? colors.primary : "#1B4B8C"} />
          <View style={styles.supportContent}>
            <Text style={[styles.supportTitle, { color: isDark ? colors.primary : "#1B4B8C" }]}>Need help with this transfer?</Text>
            <Text style={[styles.supportText, { color: isDark ? colors.primary : "#1B4B8C" }]}>Contact our support team</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  statusCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusEmoji: {
    fontSize: 24,
    color: '#fff',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  statusAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  transactionId: {
    flexWrap: 'wrap',
    flex: 1,
    textAlign: 'right',
  },
  detailLabelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailValueBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  timelineCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  supportText: {
    fontSize: 12,
    opacity: 0.8,
  },
});