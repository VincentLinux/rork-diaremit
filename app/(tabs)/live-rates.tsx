import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import {
  RefreshCw,
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  TrendingUp,
  Shield,
  Zap,
  Award,
  Bot,
  Send,
  Calendar,
  X,
} from "lucide-react-native";
import { useTransfer } from "@/providers/TransferProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { PanAfrican, useResponsiveDimensions } from "@/constants/colors";

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

export default function LiveRatesScreen() {
  const {
    liveRates,
    selectedInstitutions,
    isRefreshingRates,
    refreshLiveRates,
    selectInstitution,
    getSelectedInstitution,
    getBestRateForCountry,
    analyzeRatesWithAI,
    isAnalyzingRates,
  } = useTransfer();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { responsiveFont, isSmallScreen } = useResponsiveDimensions();

  const [sourceCurrency, setSourceCurrency] = useState<SourceCurrency>("EUR");
  const [sendAmount] = useState<number>(100);
  const [aiAnalysisForCountry, setAiAnalysisForCountry] = useState<string | null>(null);
  const [selectedRate, setSelectedRate] = useState<{country: string, institution: any} | null>(null);

  const sourceSymbol = useMemo(
    () => SOURCE_CURRENCIES.find((c) => c.code === sourceCurrency)?.symbol ?? "$",
    [sourceCurrency]
  );

  const handleInstitutionSelect = (country: string, institutionId: string) => {
    const currentSelected = getSelectedInstitution(country);
    
    // If clicking the same institution, unselect it
    if (currentSelected?.id === institutionId) {
      selectInstitution(country, ""); // Clear selection
      setSelectedRate(null);
      return;
    }
    
    selectInstitution(country, institutionId);
    const countryData = liveRates.find(c => c.country === country);
    const institution = countryData?.institutions.find(i => i.id === institutionId);
    
    if (institution) {
      setSelectedRate({ country, institution });
    }
  };

  const handleClearSelection = () => {
    if (selectedRate) {
      selectInstitution(selectedRate.country, "");
      setSelectedRate(null);
    }
  };

  const handleTransferWithRate = () => {
    if (selectedRate) {
      router.push({
        pathname: "/send-money",
        params: {
          preselectedCountry: selectedRate.country,
          preselectedRate: JSON.stringify({
            rate: selectedRate.institution.rate,
            currency: liveRates.find(c => c.country === selectedRate.country)?.currency,
            country: selectedRate.country,
            institution: selectedRate.institution.name
          })
        }
      });
    }
  };

  const handleScheduleWithRate = () => {
    if (selectedRate) {
      router.push({
        pathname: "/send-money",
        params: {
          preselectedCountry: selectedRate.country,
          preselectedRate: JSON.stringify({
            rate: selectedRate.institution.rate,
            currency: liveRates.find(c => c.country === selectedRate.country)?.currency,
            country: selectedRate.country,
            institution: selectedRate.institution.name
          }),
          scheduleMode: "true"
        }
      });
    }
  };

  const handleAIAnalysis = async (country: string, currency: string) => {
    try {
      setAiAnalysisForCountry(country);
      await analyzeRatesWithAI(sourceCurrency, currency, sendAmount);
    } catch {
      console.log("Failed to analyze rates");
      setAiAnalysisForCountry(null);
    }
  };

  const calculateReceiveAmount = (rate: number, fee: number) => {
    const baseUSD = convertToUSD(sendAmount, sourceCurrency);
    return baseUSD * rate - fee;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} size={12} color={PanAfrican.gold} fill={PanAfrican.gold} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" size={12} color={PanAfrican.gold} fill="none" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} size={12} color={colors.textSecondary} fill="none" />
      );
    }

    return stars;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}>
      <View style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Live Rates Comparison
          </Text>
          <TouchableOpacity
            onPress={refreshLiveRates}
            disabled={isRefreshingRates}
            style={styles.refreshButton}
          >
            <RefreshCw
              size={20}
              color={colors.text}
              style={[
                isRefreshingRates && { transform: [{ rotate: "180deg" }] },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: selectedRate ? 100 : 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Compare Live Exchange Rates
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choose the best institution for your transfer
          </Text>
        </View>

        <View style={styles.currencySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("sendFrom")}
          </Text>
          <View style={styles.currencyRow}>
            {SOURCE_CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[
                  styles.currencyChip,
                  {
                    backgroundColor:
                      sourceCurrency === c.code
                        ? colors.primary
                        : colors.backgroundSecondary,
                  },
                ]}
                onPress={() => setSourceCurrency(c.code)}
              >
                <Text
                  style={[
                    styles.currencyChipText,
                    {
                      color:
                        sourceCurrency === c.code ? "#fff" : colors.text,
                    },
                  ]}
                >
                  {c.symbol} {c.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.comparisonTitle, { color: colors.text }]}>
          When you send {sourceSymbol}{sendAmount} {sourceCurrency}
        </Text>

        {liveRates.map((countryRate) => {
          const selectedInstitution = getSelectedInstitution(countryRate.country);
          const bestRate = getBestRateForCountry(countryRate.country);

          return (
            <View
              key={countryRate.country}
              style={[styles.countryCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.countryHeader}>
                <View style={styles.countryInfo}>
                  <Text style={[styles.countryName, { color: colors.text }]}>
                    {countryRate.flag} {countryRate.country}
                  </Text>
                  <Text style={[styles.currencyInfo, { color: colors.textSecondary }]}>
                    Currency: {countryRate.currency}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.aiButton, { backgroundColor: PanAfrican.gold + "20" }]}
                  onPress={() => handleAIAnalysis(countryRate.country, countryRate.currency)}
                  disabled={isAnalyzingRates}
                >
                  {isAnalyzingRates && aiAnalysisForCountry === countryRate.country ? (
                    <ActivityIndicator size={16} color={PanAfrican.gold} />
                  ) : (
                    <Bot size={16} color={PanAfrican.gold} />
                  )}
                  <Text style={[styles.aiButtonText, { color: PanAfrican.gold }]}>
                    AI Analysis
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.institutionsContainer}>
                {countryRate.institutions.map((institution, index) => {
                  const receiveAmount = calculateReceiveAmount(
                    institution.rate,
                    institution.fee
                  );
                  const isSelected = selectedInstitution?.id === institution.id;
                  const isBest = bestRate?.id === institution.id;
                  const isLastInstitution = index === countryRate.institutions.length - 1;

                  return (
                    <View key={institution.id}>
                      <TouchableOpacity
                        style={[
                          styles.institutionCard,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? "#064E3B"
                                : "#F0FDF4"
                              : colors.backgroundSecondary,
                            borderColor: isSelected
                              ? PanAfrican.green
                              : "transparent",
                            borderWidth: isSelected ? 2 : 0,
                          },
                        ]}
                        onPress={() =>
                          handleInstitutionSelect(countryRate.country, institution.id)
                        }
                      >
                      {isBest && (
                        <View style={styles.bestRateBadge}>
                          <Award size={12} color={PanAfrican.gold} />
                          <Text style={[styles.bestRateText, { color: PanAfrican.gold }]}>
                            Best Rate
                          </Text>
                        </View>
                      )}

                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <CheckCircle size={16} color={PanAfrican.green} />
                        </View>
                      )}

                      <View style={styles.institutionHeader}>
                        <Text style={[styles.institutionName, { color: colors.text }]}>
                          {institution.name}
                        </Text>
                        <View style={styles.ratingContainer}>
                          <View style={styles.stars}>{renderStars(institution.rating)}</View>
                          <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                            {institution.rating}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.rateInfo}>
                        <View style={styles.rateRow}>
                          <TrendingUp size={16} color={PanAfrican.green} />
                          <Text style={[styles.rateText, { color: colors.text }]}>
                            1 USD = {institution.rate.toFixed(4)} {countryRate.currency}
                          </Text>
                        </View>
                        <View style={styles.receiveAmountContainer}>
                          <Text style={[styles.receiveLabel, { color: colors.textSecondary }]}>
                            You get:
                          </Text>
                          <Text style={[styles.receiveAmount, { color: PanAfrican.green }]}>
                            {receiveAmount.toFixed(2)} {countryRate.currency}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                          <DollarSign size={14} color={colors.textSecondary} />
                          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                            Fee: ${institution.fee}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Clock size={14} color={colors.textSecondary} />
                          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                            {institution.transferTime}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.featuresContainer}>
                        <Text style={[styles.featuresTitle, { color: colors.textSecondary }]}>
                          Features:
                        </Text>
                        <View style={styles.featuresRow}>
                          {institution.features.slice(0, 3).map((feature, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.featureTag,
                                { backgroundColor: colors.backgroundTertiary },
                              ]}
                            >
                              <Text style={[styles.featureText, { color: colors.text }]}>
                                {feature}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>

                        <View style={styles.lastUpdated}>
                          <Text style={[styles.lastUpdatedText, { color: colors.textSecondary }]}>
                            Updated: {new Date(institution.lastUpdated).toLocaleTimeString()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      
                      {!isLastInstitution && (
                        <View style={[styles.institutionSeparator, { backgroundColor: colors.border }]} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={[styles.disclaimer, { backgroundColor: colors.backgroundSecondary }]}>
          <Shield size={16} color={colors.textSecondary} />
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            Rates are indicative and may change. Final rates will be confirmed at the time of
            transfer. Your selected institutions will be used as preferences for future
            transfers.
          </Text>
        </View>
      </ScrollView>
      
      {selectedRate && (
        <View style={[styles.actionFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClearSelection}
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.footerContent}>
            <View style={styles.selectedRateInfo}>
              <Text style={[styles.selectedRateTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedRate.institution.name}
              </Text>
              <Text style={[styles.selectedRateSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {selectedRate.country} • {selectedRate.institution.rate.toFixed(4)} {liveRates.find(c => c.country === selectedRate.country)?.currency}/USD
              </Text>
              <Text style={[styles.receiveAmountText, { color: PanAfrican.green }]} numberOfLines={1}>
                You get: {calculateReceiveAmount(selectedRate.institution.rate, selectedRate.institution.fee).toFixed(2)} {liveRates.find(c => c.country === selectedRate.country)?.currency}
              </Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.scheduleButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={handleScheduleWithRate}
              >
                <Calendar size={16} color={colors.text} />
                <Text style={[styles.scheduleButtonText, { color: colors.text }]}>Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.transferButton}
                onPress={handleTransferWithRate}
              >
                <Send size={16} color="#fff" />
                <Text style={styles.transferButtonText}>Send Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  actionFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    minHeight: 100,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 8,
    zIndex: 1,
  },
  footerContent: {
    flex: 1,
    paddingTop: 8,
    paddingRight: 40,
  },
  selectedRateInfo: {
    marginBottom: 16,
  },
  selectedRateTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  selectedRateSubtitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  receiveAmountText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  scheduleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  transferButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PanAfrican.green,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  transferButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  currencySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  currencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  currencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  currencyChipText: {
    fontWeight: "600",
    fontSize: 14,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  countryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  countryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  currencyInfo: {
    fontSize: 14,
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  institutionsContainer: {
    gap: 12,
  },
  institutionCard: {
    borderRadius: 12,
    padding: 16,
    position: "relative",
  },
  bestRateBadge: {
    position: "absolute",
    top: -8,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PanAfrican.gold + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
  },
  bestRateText: {
    fontSize: 10,
    fontWeight: "700",
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
  },
  institutionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  institutionName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "500",
  },
  rateInfo: {
    marginBottom: 12,
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  rateText: {
    fontSize: 14,
    fontWeight: "500",
  },
  receiveAmountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiveLabel: {
    fontSize: 14,
  },
  receiveAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  featuresContainer: {
    marginBottom: 8,
  },
  featuresTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  featuresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  featureTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featureText: {
    fontSize: 10,
    fontWeight: "500",
  },
  lastUpdated: {
    alignItems: "flex-end",
  },
  lastUpdatedText: {
    fontSize: 10,
    fontStyle: "italic",
  },
  disclaimer: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  institutionSeparator: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 4,
  },
});