import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { useTransfer } from "@/providers/TransferProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { PanAfrican, useResponsiveDimensions } from "@/constants/colors";
import { TrendingUp, Clock, Shield, Award, Bot, Calendar, Target, BarChart3 } from "lucide-react-native";

const SOURCE_CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "SEK", symbol: "kr" },
  { code: "NOK", symbol: "kr" },
  { code: "DKK", symbol: "kr" },
  { code: "GBP", symbol: "£" },
] as const;

type SourceCurrency = typeof SOURCE_CURRENCIES[number]["code"];

function convertToUSD(value: number, code: SourceCurrency) {
  const fx: Record<SourceCurrency, number> = {
    USD: 1,
    EUR: 1.08,
    SEK: 0.091,
    NOK: 0.094,
    DKK: 0.14,
    GBP: 1.27,
  };
  return value * (fx[code] ?? 1);
}



const transferTimes: Record<string, string> = {
  'Ghana': '1-2 hours',
  'Kenya': 'Instant',
  'Senegal': '2-4 hours',
  'Uganda': '1-3 hours',
};

const competitors = ['Remitly', 'WorldRemit', 'Wise', 'Western Union'];

export default function MarketScreen() {
  const { 
    exchangeRates, 
    aiRateAnalysis, 
    isAnalyzingRates, 
    analyzeRatesWithAI, 
    scheduleTransfer,
    scheduledTransfers 
  } = useTransfer();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { responsiveFont, isSmallScreen } = useResponsiveDimensions();
  const [sourceCurrency, setSourceCurrency] = useState<SourceCurrency>("EUR");
  const [sendAmount] = useState<number>(100);

  const [aiAnalysisForCountry, setAiAnalysisForCountry] = useState<string | null>(null);


  const sourceSymbol = useMemo(() => SOURCE_CURRENCIES.find(c => c.code === sourceCurrency)?.symbol ?? "$", [sourceCurrency]);

  const rows = useMemo(() => {
    const baseUSD = convertToUSD(sendAmount, sourceCurrency);
    return exchangeRates.map(r => {
      const ourReceive = baseUSD * r.rate - 2.99;
      const competitorRate = r.rate * 0.985;
      const competitorFee = 4.99;
      const competitorReceive = baseUSD * competitorRate - competitorFee;
      const advantage = ourReceive - competitorReceive;
      return { 
        ...r, 
        ourReceive, 
        competitorReceive, 
        advantage,
        transferTime: transferTimes[r.country] || '1-2 hours'
      };
    });
  }, [exchangeRates, sendAmount, sourceCurrency]);

  const handleAIAnalysis = async (targetCurrency: string, country: string) => {
    try {
      setAiAnalysisForCountry(country);
      await analyzeRatesWithAI(sourceCurrency, targetCurrency, sendAmount);
    } catch {
      console.log('Failed to analyze rates');
      setAiAnalysisForCountry(null);
    }
  };

  const handleScheduleTransfer = (rate: any) => {
    Alert.alert(
      t('scheduleTransfer'),
      `${t('scheduleTransferConfirm')} ${rate.rate} ${rate.currency}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('scheduleTransfer'),
          onPress: () => {
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + 1);
            
            scheduleTransfer({
              recipientId: 'temp',
              amount: sendAmount,
              sourceCurrency,
              targetCurrency: rate.currency,
              selectedRate: rate,
              scheduledDate: scheduledDate.toISOString(),
              status: 'scheduled',
              aiAnalysis: aiRateAnalysis || undefined
            });
            
            Alert.alert(t('success'), t('transferScheduledSuccess'));
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.backgroundTertiary }]} contentContainerStyle={styles.content} testID="marketScreen">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('exchangeRates')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('liveRatesUpdated')}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <TrendingUp size={20} color={PanAfrican.green} />
          <Text style={[styles.statValue, { color: colors.text }]}>1.5%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('betterRates')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Bot size={20} color={PanAfrican.gold} />
          <Text style={[styles.statValue, { color: colors.text }]}>AI</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('aiPowered')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Calendar size={20} color={PanAfrican.red} />
          <Text style={[styles.statValue, { color: colors.text }]}>{scheduledTransfers.filter(t => t.status === 'scheduled').length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('scheduled')}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.liveRatesButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/live-rates')}
        testID="live-rates-button"
      >
        <BarChart3 size={20} color="#fff" />
        <Text style={styles.liveRatesButtonText}>Compare Live Rates from Multiple Institutions</Text>
      </TouchableOpacity>

      <View style={styles.currencySection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('sendFrom')}</Text>
        <View style={styles.currencyRow}>
          {SOURCE_CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c.code}
              style={[styles.currencyChip, { backgroundColor: sourceCurrency === c.code ? colors.primary : colors.backgroundSecondary }, sourceCurrency === c.code && styles.currencyChipActive]}
              onPress={() => setSourceCurrency(c.code)}
              testID={`market-currency-${c.code}`}
            >
              <Text style={[styles.currencyChipText, { color: sourceCurrency === c.code ? '#fff' : colors.text }, sourceCurrency === c.code && styles.currencyChipTextActive]}>
                {c.symbol} {c.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>



      <Text style={[styles.comparisonTitle, { color: colors.text }]}>{t('whenYouSend')} {sourceSymbol}{sendAmount} {sourceCurrency}</Text>

      {rows.map((row) => (
        <View key={row.country} style={[styles.card, { backgroundColor: colors.card }]} testID={`market-${row.country}`}>
          <View style={styles.cardHeader}>
            <View style={styles.countryInfo}>
              <View style={styles.countryDetails}>
                <Text style={[styles.country, { color: colors.text, fontSize: responsiveFont(isSmallScreen ? 16 : 18) }]} numberOfLines={1} ellipsizeMode="tail">{row.flag} {row.country}</Text>
                <Text style={[styles.rate, { color: colors.textSecondary, fontSize: responsiveFont(isSmallScreen ? 12 : 14) }]} numberOfLines={1}>1 USD = {row.rate} {row.currency}</Text>
                <View style={styles.transferTimeContainer}>
                  <Clock size={12} color={PanAfrican.green} />
                  <Text style={[styles.transferTime, { fontSize: responsiveFont(isSmallScreen ? 10 : 12) }]} numberOfLines={1}>{row.transferTime}</Text>
                </View>
              </View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.aiButton, { backgroundColor: PanAfrican.gold + '20' }]}
                onPress={() => handleAIAnalysis(row.currency, row.country)}
                disabled={isAnalyzingRates}
              >
                {isAnalyzingRates ? (
                  <ActivityIndicator size={12} color={PanAfrican.gold} />
                ) : (
                  <Bot size={12} color={PanAfrican.gold} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.scheduleButton, { backgroundColor: PanAfrican.green + '20' }]}
                onPress={() => handleScheduleTransfer(row)}
              >
                <Calendar size={12} color={PanAfrican.green} />
              </TouchableOpacity>
              <View style={[styles.advantageBadge, row.advantage >= 0 ? styles.advantageGood : styles.advantageBad]}>
                <Award size={12} color={row.advantage >= 0 ? PanAfrican.green : PanAfrican.red} />
                <Text style={[styles.advantageText, { color: row.advantage >= 0 ? PanAfrican.green : PanAfrican.red, fontSize: responsiveFont(isSmallScreen ? 10 : 12) }]}>
                  {row.advantage >= 0 ? "+" : ""}{row.advantage.toFixed(2)} {row.currency}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.comparisonRow}>
            <View style={[styles.ourRate, { backgroundColor: isDark ? '#064E3B' : '#F0FDF4' }]}>
              <Text style={[styles.providerLabel, { color: colors.textSecondary, fontSize: responsiveFont(isSmallScreen ? 10 : 12) }]}>DiaRemit</Text>
              <Text style={[styles.receiveAmount, { color: PanAfrican.green, fontSize: responsiveFont(isSmallScreen ? 16 : 20) }]}>
                {row.ourReceive.toFixed(2)} {row.currency}
              </Text>
              <Text style={[styles.feeText, { color: colors.textSecondary, fontSize: responsiveFont(isSmallScreen ? 9 : 11) }]}>{t('fee')}: $2.99</Text>
            </View>
            
            <View style={styles.vsText}>
              <Text style={[styles.vs, { color: colors.textSecondary, fontSize: responsiveFont(isSmallScreen ? 12 : 14) }]}>{t('vs')}</Text>
            </View>
            
            <View style={[styles.competitorRate, { backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2' }]}>
              <Text style={[styles.providerLabel, { color: colors.textSecondary, fontSize: responsiveFont(isSmallScreen ? 10 : 12) }]}>{t('competitors')}</Text>
              <Text style={[styles.receiveAmount, { color: PanAfrican.red, fontSize: responsiveFont(isSmallScreen ? 16 : 20) }]}>
                {row.competitorReceive.toFixed(2)} {row.currency}
              </Text>
              <Text style={[styles.feeText, { color: colors.textSecondary, fontSize: responsiveFont(isSmallScreen ? 9 : 11) }]}>Avg {t('fee')}: $4.99</Text>
            </View>
          </View>

          {aiRateAnalysis && aiAnalysisForCountry === row.country && (
            <View style={[styles.aiAnalysisInCard, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.aiHeader}>
                <Bot size={16} color={PanAfrican.gold} />
                <Text style={[styles.aiTitle, { color: colors.text, fontSize: responsiveFont(isSmallScreen ? 12 : 14) }]}>{t('aiMarketAnalysis')}</Text>
                <View style={[styles.trendBadge, aiRateAnalysis.marketTrend === 'up' ? styles.trendUp : aiRateAnalysis.marketTrend === 'down' ? styles.trendDown : styles.trendStable]}>
                  <Text style={[styles.trendText, { color: aiRateAnalysis.marketTrend === 'up' ? PanAfrican.green : aiRateAnalysis.marketTrend === 'down' ? PanAfrican.red : colors.textSecondary }]}>
                    {aiRateAnalysis.marketTrend.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.aiRecommendation, { color: colors.textSecondary, fontSize: responsiveFont(isSmallScreen ? 11 : 13), lineHeight: responsiveFont(isSmallScreen ? 15 : 18) }]}>{aiRateAnalysis.recommendation}</Text>
              <View style={styles.aiStats}>
                <View style={styles.aiStat}>
                  <Target size={12} color={PanAfrican.green} />
                  <Text style={[styles.aiStatText, { color: colors.text, fontSize: responsiveFont(isSmallScreen ? 9 : 11) }]}>{t('bestRate')}: {aiRateAnalysis.bestRate.rate}</Text>
                </View>
                <View style={styles.aiStat}>
                  <Shield size={12} color={PanAfrican.gold} />
                  <Text style={[styles.aiStatText, { color: colors.text, fontSize: responsiveFont(isSmallScreen ? 9 : 11) }]}>{t('confidence')}: {Math.round(aiRateAnalysis.confidence * 100)}%</Text>
                </View>
              </View>
              <Text style={[styles.aiSources, { color: colors.textSecondary, fontSize: responsiveFont(isSmallScreen ? 8 : 10), fontStyle: 'italic', marginTop: 8 }]}>{t('sources')}: {aiRateAnalysis.sources.join(', ')}</Text>
            </View>
          )}

          <View style={[styles.competitorsList, { borderTopColor: colors.borderLight }]}>
            <Text style={[styles.competitorsTitle, { color: colors.textSecondary, fontSize: responsiveFont(isSmallScreen ? 10 : 12) }]}>{t('comparedWith')}:</Text>
            <View style={styles.competitorsRow}>
              {competitors.map((comp, idx) => (
                <Text key={idx} style={[styles.competitorName, { color: colors.textSecondary, backgroundColor: colors.backgroundSecondary, fontSize: responsiveFont(isSmallScreen ? 9 : 11) }]} numberOfLines={1}>{comp}</Text>
              ))}
            </View>
          </View>
        </View>
      ))}

      <View style={[styles.disclaimer, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.disclaimerText, { color: colors.textSecondary, fontSize: responsiveFont(isSmallScreen ? 10 : 12) }]}>
          {t('ratesIndicative')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  statValue: { fontSize: 18, fontWeight: "700", marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 12 },
  currencySection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  currencyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  currencyChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  currencyChipActive: {},
  currencyChipText: { fontWeight: "600", fontSize: 14 },
  currencyChipTextActive: {},
  comparisonTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16, textAlign: "center" },
  card: { borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  countryInfo: { flex: 1 },
  countryDetails: { flex: 1 },
  country: { fontSize: 18, fontWeight: "700", marginBottom: 4, flexShrink: 1 },
  rate: { fontSize: 14, marginBottom: 6, flexShrink: 1 },
  transferTimeContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  transferTime: { fontSize: 12, color: PanAfrican.green, fontWeight: "600", flexShrink: 1 },
  advantageBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 },
  advantageGood: { backgroundColor: "#D1FAE5" },
  advantageBad: { backgroundColor: "#FEE2E2" },
  advantageText: { fontSize: 12, fontWeight: "700" },
  comparisonRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  ourRate: { flex: 1, alignItems: "center", padding: 16, borderRadius: 12 },
  competitorRate: { flex: 1, alignItems: "center", padding: 16, borderRadius: 12 },
  vsText: { paddingHorizontal: 16 },
  vs: { fontSize: 14, fontWeight: "700" },
  providerLabel: { fontSize: 12, marginBottom: 8, fontWeight: "600" },
  receiveAmount: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  feeText: { fontSize: 11 },
  competitorsList: { borderTopWidth: 1, paddingTop: 16 },
  competitorsTitle: { fontSize: 12, marginBottom: 8, fontWeight: "600" },
  competitorsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  competitorName: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexShrink: 1 },
  disclaimer: { padding: 16, borderRadius: 12, marginTop: 8 },
  disclaimerText: { fontSize: 12, textAlign: "center", lineHeight: 16 },
  aiAnalysisCard: { padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  aiTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
  aiCountry: { fontSize: 12, fontStyle: "italic", marginLeft: 8 },
  trendBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  trendUp: { backgroundColor: "#D1FAE5" },
  trendDown: { backgroundColor: "#FEE2E2" },
  trendStable: { backgroundColor: "#F3F4F6" },
  trendText: { fontSize: 10, fontWeight: "700" },
  aiRecommendation: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  aiStats: { flexDirection: "row", gap: 16, marginBottom: 8 },
  aiStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  aiStatText: { fontSize: 12, fontWeight: "600" },
  aiSources: { fontSize: 11, fontStyle: "italic" },
  actionButtons: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiButton: { padding: 8, borderRadius: 8 },
  scheduleButton: { padding: 8, borderRadius: 8 },
  aiAnalysisInCard: { padding: 12, borderRadius: 8, marginTop: 12, marginBottom: 8 },
  liveRatesButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, marginBottom: 20, gap: 8, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  liveRatesButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});