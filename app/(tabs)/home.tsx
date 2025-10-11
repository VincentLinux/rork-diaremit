import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Send, Users, Clock, Bot, Calendar, BarChart3 } from "lucide-react-native";
import { useTransfer } from "@/providers/TransferProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { useBalance } from "@/providers/BalanceProvider";
import { useAuth } from "@/providers/AuthProvider";
import { LinearGradient } from "expo-linear-gradient";
import { PanAfrican, useResponsiveDimensions } from "@/constants/colors";

export default function HomeScreen() {
  const { exchangeRates, recentTransfers, scheduledTransfers, loadSupabaseData } = useTransfer();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { responsiveFont, isSmallScreen, width } = useResponsiveDimensions();
  const { getBalance, balances, refreshBalances, refreshing } = useBalance();
  const { user } = useAuth();

  const handleRefresh = async () => {
    console.log('Refreshing home page data...');
    await Promise.all([
      refreshBalances(),
      loadSupabaseData()
    ]);
    console.log('Home page data refreshed');
  };

  // Responsive text component for Quick Actions
  const ResponsiveActionText = ({ children, style }: { children: string; style?: any }) => {
    const [fontSize, setFontSize] = useState(12);
    
    useEffect(() => {
      // Calculate optimal font size based on screen width and text length
      const screenWidth = width;
      const actionCardWidth = (screenWidth - 48) / 4; // 4 cards with gaps
      const availableTextWidth = actionCardWidth - 20; // padding
      
      // Base font size calculation
      let optimalSize = 12;
      
      // Adjust based on text length and available width
      const textLength = children.length;
      if (textLength <= 4) {
        optimalSize = Math.min(14, availableTextWidth / 3);
      } else if (textLength <= 8) {
        optimalSize = Math.min(12, availableTextWidth / 4);
      } else {
        optimalSize = Math.min(10, availableTextWidth / 5);
      }
      
      // Ensure minimum readable size
      optimalSize = Math.max(9, optimalSize);
      
      setFontSize(Math.round(optimalSize));
    }, [children]);
    
    return (
      <Text 
        style={[style, { fontSize }]} 
        numberOfLines={2} 
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {children}
      </Text>
    );
  };

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'SEK':
      case 'NOK':
      case 'DKK': return 'kr';
      default: return '$';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {user && balances.length > 0 && (
          <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Available Balance</Text>
            <View style={styles.balanceRow}>
              {balances.map((balance) => (
                <View key={balance.currency} style={styles.balanceItem}>
                  <Text style={[styles.balanceAmount, { color: colors.text }]}>
                    {getCurrencySymbol(balance.currency)}{balance.amount.toFixed(2)}
                  </Text>
                  <Text style={[styles.balanceCurrency, { color: colors.textSecondary }]}>
                    {balance.currency}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.welcomeCard}>
          <Image 
            source={{ uri: 'https://r2-pub.rork.com/generated-images/46476521-fd86-43b1-a8e8-1fef20b61731.png' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.4)', 'transparent']}
            style={styles.heroOverlay}
          >
            <Text style={[styles.welcomeText, { fontSize: responsiveFont(isSmallScreen ? 20 : 24) }]}>{t('sendMoney')}</Text>
            <Text style={[styles.heroSubtitle, { fontSize: responsiveFont(isSmallScreen ? 14 : 16), lineHeight: responsiveFont(isSmallScreen ? 18 : 22) }]}>Fast, secure, and AI-optimized transfers to Africa</Text>
            
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => router.push("/send-money")}
              activeOpacity={0.8}
            >
              <Send size={20} color={PanAfrican.black} />
              <Text style={[styles.sendButtonText, { fontSize: responsiveFont(isSmallScreen ? 14 : 16) }]}>{t('sendMoneyNow')}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bot size={20} color={PanAfrican.green} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: responsiveFont(isSmallScreen ? 18 : 20) }]}>{t('aiPoweredRates')}</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={() => router.push("/live-rates")} style={styles.liveRatesHeaderButton}>
                <BarChart3 size={16} color={PanAfrican.gold} />
                <Text style={[styles.liveRatesHeaderText, { color: PanAfrican.gold, fontSize: responsiveFont(isSmallScreen ? 10 : 12) }]}>Live</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/(tabs)/market")}>
                <Text style={[styles.seeAll, { color: PanAfrican.green, fontSize: responsiveFont(isSmallScreen ? 12 : 14) }]}>{t('compare')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.ratesContainer}>
            {exchangeRates.map((rate) => {
              const competitorRate = rate.rate * 0.985;
              const advantage = ((rate.rate - competitorRate) / competitorRate * 100);
              return (
                <View key={rate.country} style={[styles.rateCard, { backgroundColor: colors.card }]}>
                  <View style={styles.flagBackground}>
                    <Text style={styles.flagBackgroundText}>{rate.flag}</Text>
                  </View>
                  <View style={styles.rateContent}>
                    <Text style={styles.rateFlag}>{rate.flag}</Text>
                    <Text style={[styles.rateCountry, { color: colors.text, fontSize: responsiveFont(isSmallScreen ? 12 : 14) }]}>{rate.country}</Text>
                    <Text style={[styles.rateValue, { color: colors.textSecondary, fontSize: responsiveFont(isSmallScreen ? 10 : 12) }]}>
                      1 USD = {rate.rate} {rate.currency}
                    </Text>
                    <View style={styles.advantageBadge}>
                      <Text style={[styles.advantageText, { fontSize: responsiveFont(isSmallScreen ? 8 : 10) }]}>+{advantage.toFixed(1)}% vs others</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: responsiveFont(isSmallScreen ? 18 : 20) }]}>{t('quickActions')}</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push("/send-money")}
            >
              <View style={[styles.actionIcon, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }] }>
                <Send size={20} color={PanAfrican.red} />
              </View>
              <ResponsiveActionText style={[styles.actionText, { color: colors.text }]}>
                {t('send')}
              </ResponsiveActionText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push("/add-recipient")}
            >
              <View style={[styles.actionIcon, { backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }]}>
                <Users size={20} color={PanAfrican.green} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionText, { color: colors.text, fontSize: 11 }]}>
                  Add
                </Text>
                <Text style={[styles.actionText, { color: colors.text, fontSize: 11 }]}>
                  Recipient
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push("/(tabs)/history")}
            >
              <View style={[styles.actionIcon, { backgroundColor: isDark ? '#92400E' : '#FEF3C7' }]}>
                <Clock size={20} color={PanAfrican.gold} />
              </View>
              <ResponsiveActionText style={[styles.actionText, { color: colors.text }]}>
                {t('history')}
              </ResponsiveActionText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.card, position: 'relative' }]}
              onPress={() => router.push("/scheduled-transfers")}
            >
              <View style={[styles.actionIcon, { backgroundColor: isDark ? '#92400E' : '#FEF3C7' }]}>
                <Calendar size={20} color={PanAfrican.gold} />
              </View>
              <Text style={[styles.actionText, { color: colors.text, fontSize: 11 }]}>
                Schedule
              </Text>
              {scheduledTransfers.filter(t => t.status === 'scheduled').length > 0 && (
                <View style={[styles.badge, { backgroundColor: PanAfrican.red }]}>
                  <Text style={[styles.badgeText, { fontSize: responsiveFont(isSmallScreen ? 10 : 12) }]}>
                    {scheduledTransfers.filter(t => t.status === 'scheduled').length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {recentTransfers && recentTransfers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: responsiveFont(isSmallScreen ? 18 : 20) }]}>{t('recentTransfers')}</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
                <Text style={[styles.seeAll, { color: PanAfrican.green, fontSize: responsiveFont(isSmallScreen ? 12 : 14) }]}>{t('seeAll')}</Text>
              </TouchableOpacity>
            </View>
            
            {recentTransfers.slice(0, 3).map((transfer) => (
              <TouchableOpacity
                key={transfer.id}
                style={[styles.transferCard, { backgroundColor: colors.card }]}
                onPress={() => router.push({
                  pathname: "/transaction-details",
                  params: { id: transfer.id }
                })}
              >
                <View style={styles.transferLeft}>
                  <View style={[styles.transferAvatar, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.transferInitial, { color: PanAfrican.red }]}>
                      {transfer.recipient_name[0]}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.transferName, { color: colors.text, fontSize: responsiveFont(isSmallScreen ? 14 : 16) }]}>{transfer.recipient_name}</Text>
                    <Text style={[styles.transferDate, { color: colors.textSecondary, fontSize: responsiveFont(isSmallScreen ? 10 : 12) }]}>{transfer.date}</Text>
                  </View>
                </View>
                <View style={styles.transferRight}>
                  <Text style={[styles.transferAmount, { color: colors.text, fontSize: responsiveFont(isSmallScreen ? 14 : 16) }]}>
                    {getCurrencySymbol(transfer.source_currency)}{transfer.amount}
                  </Text>
                  <Text style={[
                    styles.transferStatus,
                    { color: transfer.status === 'completed' ? '#10B981' : '#F59E0B', fontSize: responsiveFont(isSmallScreen ? 10 : 12) }
                  ]}>
                    {transfer.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  balanceItem: {
    flex: 1,
    minWidth: 120,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  balanceCurrency: {
    fontSize: 12,
  },
  welcomeCard: {
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    height: 220,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 24,
    lineHeight: 22,
  },
  sendButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: PanAfrican.black,
  },
  section: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    flex: 1,
    marginLeft: 8,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  ratesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  rateCard: {
    padding: 18,
    borderRadius: 16,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  flagBackground: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.1,
    transform: [{ rotate: '15deg' }],
  },
  flagBackgroundText: {
    fontSize: 60,
  },
  rateContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  rateFlag: {
    fontSize: 28,
    marginBottom: 8,
  },
  rateCountry: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  rateValue: {
    fontSize: 12,
    marginBottom: 6,
  },
  advantageBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'center',
  },
  advantageText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: PanAfrican.green,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    minHeight: 100,
    maxWidth: 90,
    justifyContent: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontWeight: '500' as const,
    textAlign: 'center' as const,
    lineHeight: 14,
  },
  actionTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    width: '100%',
  },

  transferCard: {
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  transferLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transferAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferInitial: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  transferName: {
    fontSize: 16,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  transferDate: {
    fontSize: 12,
  },
  transferRight: {
    alignItems: 'flex-end',
  },
  transferAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  transferStatus: {
    fontSize: 12,
    fontWeight: '500' as const,
    textTransform: 'capitalize' as const,
  },
  badge: { 
    position: "absolute" as const, 
    top: -4, 
    right: -4, 
    backgroundColor: PanAfrican.red, 
    borderRadius: 10, 
    minWidth: 20, 
    height: 20, 
    alignItems: "center" as const, 
    justifyContent: "center" as const 
  },
  badgeText: { 
    color: "white", 
    fontSize: 12, 
    fontWeight: "700" as const 
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liveRatesHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: PanAfrican.gold + '20',
  },
  liveRatesHeaderText: {
    fontWeight: '600' as const,
  },
});