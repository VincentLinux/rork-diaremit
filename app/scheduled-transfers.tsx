import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Stack } from "expo-router";
import { useTransfer } from "@/providers/TransferProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { PanAfrican } from "@/constants/colors";
import { Calendar, Clock, Bot, X, CheckCircle, AlertCircle } from "lucide-react-native";

export default function ScheduledTransfersScreen() {
  const { scheduledTransfers, cancelScheduledTransfer } = useTransfer();
  const { colors } = useTheme();

  const handleCancelTransfer = (transferId: string) => {
    Alert.alert(
      'Cancel Transfer',
      'Are you sure you want to cancel this scheduled transfer?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelScheduledTransfer(transferId);
            Alert.alert('Success', 'Transfer cancelled successfully!');
          }
        }
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock size={16} color={PanAfrican.gold} />;
      case 'executed':
        return <CheckCircle size={16} color={PanAfrican.green} />;
      case 'cancelled':
        return <X size={16} color={PanAfrican.red} />;
      default:
        return <AlertCircle size={16} color={colors.textSecondary} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return PanAfrican.gold;
      case 'executed':
        return PanAfrican.green;
      case 'cancelled':
        return PanAfrican.red;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Scheduled Transfers",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text
        }} 
      />
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.backgroundTertiary }]} 
        contentContainerStyle={styles.content}
        testID="scheduledTransfersScreen"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Scheduled Transfers</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {scheduledTransfers.filter(t => t.status === 'scheduled').length} active transfers
          </Text>
        </View>

        {scheduledTransfers.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Calendar size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Scheduled Transfers</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Schedule transfers from the Market tab to get the best rates
            </Text>
          </View>
        ) : (
          scheduledTransfers.map((transfer) => (
            <View key={transfer.id} style={[styles.transferCard, { backgroundColor: colors.card }]}>
              <View style={styles.transferHeader}>
                <View style={styles.transferInfo}>
                  <Text style={[styles.amount, { color: colors.text }]}>
                    {transfer.amount} {transfer.sourceCurrency} → {transfer.selectedRate.currency}
                  </Text>
                  <Text style={[styles.rate, { color: colors.textSecondary }]}>
                    Rate: {transfer.selectedRate.rate} {transfer.selectedRate.currency}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transfer.status) + '20' }]}>
                  {getStatusIcon(transfer.status)}
                  <Text style={[styles.statusText, { color: getStatusColor(transfer.status) }]}>
                    {transfer.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.transferDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={14} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    Scheduled: {new Date(transfer.scheduledDate).toLocaleDateString()}
                  </Text>
                </View>
                
                {transfer.selectedRate.source && (
                  <View style={styles.detailRow}>
                    <Bot size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      Source: {transfer.selectedRate.source}
                    </Text>
                  </View>
                )}

                {transfer.selectedRate.confidence && (
                  <View style={styles.detailRow}>
                    <CheckCircle size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      Confidence: {Math.round(transfer.selectedRate.confidence * 100)}%
                    </Text>
                  </View>
                )}
              </View>

              {transfer.aiAnalysis && (
                <View style={[styles.aiAnalysisSection, { backgroundColor: colors.backgroundSecondary }]}>
                  <View style={styles.aiHeader}>
                    <Bot size={16} color={PanAfrican.gold} />
                    <Text style={[styles.aiTitle, { color: colors.text }]}>AI Analysis</Text>
                  </View>
                  <Text style={[styles.aiRecommendation, { color: colors.textSecondary }]}>
                    {transfer.aiAnalysis.recommendation}
                  </Text>
                  <Text style={[styles.aiTrend, { color: colors.textSecondary }]}>
                    Market Trend: {transfer.aiAnalysis.marketTrend.toUpperCase()}
                  </Text>
                </View>
              )}

              {transfer.status === 'scheduled' && (
                <TouchableOpacity 
                  style={[styles.cancelButton, { backgroundColor: PanAfrican.red + '20' }]}
                  onPress={() => handleCancelTransfer(transfer.id)}
                >
                  <X size={16} color={PanAfrican.red} />
                  <Text style={[styles.cancelButtonText, { color: PanAfrican.red }]}>Cancel Transfer</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14 },
  emptyState: { 
    padding: 40, 
    borderRadius: 16, 
    alignItems: "center", 
    marginTop: 40,
    shadowColor: "#000", 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    shadowOffset: { width: 0, height: 1 }, 
    elevation: 2 
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  transferCard: { 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16, 
    shadowColor: "#000", 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 2 }, 
    elevation: 4 
  },
  transferHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  transferInfo: { flex: 1 },
  amount: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  rate: { fontSize: 14 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 },
  statusText: { fontSize: 12, fontWeight: "700" },
  transferDetails: { marginBottom: 16 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  detailText: { fontSize: 14 },
  aiAnalysisSection: { padding: 16, borderRadius: 12, marginBottom: 16 },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  aiTitle: { fontSize: 14, fontWeight: "600" },
  aiRecommendation: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  aiTrend: { fontSize: 12, fontWeight: "600" },
  cancelButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    padding: 12, 
    borderRadius: 12, 
    gap: 8 
  },
  cancelButtonText: { fontSize: 14, fontWeight: "600" },
});