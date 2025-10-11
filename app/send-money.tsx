import React, { useMemo, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronRight, Info, CreditCard, Smartphone, Building2, Clock, Calendar, CheckSquare, Square } from "lucide-react-native";
import { useTransfer } from "@/providers/TransferProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { useBalance } from "@/providers/BalanceProvider";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { PanAfrican } from "@/constants/colors";

const SOURCE_CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "SEK", symbol: "kr" },
  { code: "NOK", symbol: "kr" },
  { code: "DKK", symbol: "kr" },
  { code: "GBP", symbol: "£" },
] as const;

type SourceCurrency = typeof SOURCE_CURRENCIES[number]["code"];

type RecipientType = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  country: string;
  flag: string;
};

type PaymentMethod = {
  id: string;
  name: string;
  icon: React.ReactNode;
  transferTime: string;
  description: string;
};

export default function SendMoneyScreen() {
  const params = useLocalSearchParams();
  const { recipients, exchangeRates, addTransfer, preferredPaymentMethod, setPreferredPaymentMethod } = useTransfer();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { getBalance } = useBalance();
  
  // Track if we came from recipients tab
  const cameFromRecipients = Boolean((params as Record<string, string | undefined>).recipientId);

  const PAYMENT_METHODS: PaymentMethod[] = [
    {
      id: 'bank_transfer',
      name: t('bankTransfer'),
      icon: <Building2 size={20} color={PanAfrican.green} />,
      transferTime: t('businessDays'),
      description: t('directToBank')
    },
    {
      id: 'apple_pay',
      name: t('applePay'),
      icon: <Smartphone size={20} color={PanAfrican.green} />,
      transferTime: t('withinMinutes'),
      description: t('quickSecurePayments')
    },
    {
      id: 'paypal',
      name: t('paypal'),
      icon: <CreditCard size={20} color={PanAfrican.green} />,
      transferTime: t('withinMinutes'),
      description: t('paypalAccountTransfer')
    },
    {
      id: 'debit_card',
      name: t('debitCard'),
      icon: <CreditCard size={20} color={PanAfrican.green} />,
      transferTime: t('withinMinutes'),
      description: t('instantTransferCard')
    }
  ];

  const [step, setStep] = useState<number>(1);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientType | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [receivingAmount, setReceivingAmount] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("Ghana");
  const [sourceCurrency, setSourceCurrency] = useState<SourceCurrency>("EUR");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(preferredPaymentMethod || 'bank_transfer');
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledDate, setScheduledDate] = useState<string>('');

  useEffect(() => {
    const rid = (params as Record<string, string | undefined>).recipientId;
    console.log('useEffect triggered - recipientId:', rid, 'recipients count:', recipients.length);
    if (rid && step === 1) {
      const recipient = (recipients as RecipientType[]).find((r) => r.id === rid);
      console.log('Found recipient:', recipient?.name, 'current step:', step);
      if (recipient) {
        setSelectedRecipient(recipient);
        setSelectedCountry(recipient.country);
        console.log('Setting step to 2');
        setStep(2);
      } else {
        console.log('Recipient not found in recipients array');
      }
    }
  }, [params, recipients, step]);

  const convertToUSD = (value: number, code: SourceCurrency) => {
    const fx: Record<SourceCurrency, number> = {
      USD: 1,
      EUR: 1.08,
      SEK: 0.091,
      NOK: 0.094,
      DKK: 0.14,
      GBP: 1.27,
    };
    return value * (fx[code] ?? 1);
  };

  const convertFromUSD = (value: number, code: SourceCurrency) => {
    const fx: Record<SourceCurrency, number> = {
      USD: 1,
      EUR: 0.93,
      SEK: 10.98,
      NOK: 10.64,
      DKK: 7.14,
      GBP: 0.79,
    };
    return value * (fx[code] ?? 1);
  };

  const currentRate = exchangeRates.find((r) => r.country === selectedCountry);
  const baseFeeUSD = 2.99;
  const convertedFee = convertFromUSD(baseFeeUSD, sourceCurrency);
  const total = amount ? parseFloat(amount || "0") + convertedFee : 0;
  const selectedMethod = PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod);

  const sourceSymbol = useMemo(() => {
    const cur = SOURCE_CURRENCIES.find((c) => c.code === sourceCurrency);
    return cur?.symbol ?? "$";
  }, [sourceCurrency]);

  useEffect(() => {
    if (amount && currentRate) {
      const baseUSD = convertToUSD(parseFloat(amount || "0"), sourceCurrency);
      const converted = baseUSD * (currentRate?.rate ?? 0);
      setReceivingAmount(converted.toFixed(2));
    } else {
      setReceivingAmount("");
    }
  }, [amount, currentRate, sourceCurrency]);

  const handleContinue = async () => {
    console.log('handleContinue called, current step:', step, 'amount:', amount, 'selectedRecipient:', selectedRecipient?.name);
    
    if (step === 1 && !selectedRecipient) {
      Alert.alert(t('error'), "Please select a recipient");
      return;
    }
    if (step === 2 && (!amount || parseFloat(amount) <= 0)) {
      Alert.alert(t('error'), "Please enter a valid amount");
      return;
    }
    if (step === 2) {
      const currentBalance = getBalance(sourceCurrency);
      if (currentBalance < total) {
        Alert.alert(
          t('error'), 
          `Insufficient balance. You have ${sourceSymbol}${currentBalance.toFixed(2)} ${sourceCurrency} but need ${sourceSymbol}${total.toFixed(2)} ${sourceCurrency} (including fee).`
        );
        return;
      }
    }
    if (step === 3 && !selectedPaymentMethod) {
      Alert.alert(t('error'), "Please select a payment method");
      return;
    }
    if (step === 3 && isScheduled && !scheduledDate) {
      Alert.alert(t('error'), "Please select a date for scheduled transfer");
      return;
    }
    if (step < 4) {
      console.log('Advancing to next step:', step + 1);
      setStep((s) => s + 1);
    } else if (selectedRecipient) {
      // Save preferred payment method
      setPreferredPaymentMethod(selectedPaymentMethod);
      
      if (isScheduled && scheduledDate) {
        // Add to scheduled transfers
        const scheduledTransfer = {
          id: Date.now().toString(),
          recipientName: selectedRecipient.name,
          amount: amount,
          sourceCurrency: sourceCurrency,
          selectedRate: currentRate || { rate: 1, currency: 'USD', country: selectedCountry },
          scheduledDate: scheduledDate,
          status: 'scheduled' as const,
          paymentMethod: selectedMethod?.name || 'Bank Transfer',
          aiAnalysis: {
            recommendation: 'Good time to transfer based on current market conditions',
            marketTrend: 'stable' as const,
            confidence: 0.85
          }
        };
        // This would be handled by the provider
        console.log('Scheduled transfer:', scheduledTransfer);
        Alert.alert("Transfer Scheduled", "Your transfer has been scheduled for " + scheduledDate + "!", [
          { text: "View Scheduled", onPress: () => router.push('/scheduled-transfers') },
          { text: t('ok'), onPress: () => {
            if (cameFromRecipients) {
              router.push('/(tabs)/recipients');
            } else {
              router.back();
            }
          }},
        ]);
      } else {
        let recipientUserId: string | undefined = undefined;
        
        if (isSupabaseConfigured && selectedRecipient.email) {
          try {
            const trimmedEmail = selectedRecipient.email.trim().toLowerCase();
            console.log('Looking up recipient by email:', trimmedEmail);
            
            const { data: lookupData, error: lookupError } = await supabase
              .rpc('lookup_user_by_email', { p_email: trimmedEmail });
            
            if (lookupError) {
              console.error('Error looking up recipient:', lookupError);
              Alert.alert(
                t('error'),
                'Unable to verify recipient. Please try again.'
              );
              return;
            }
            
            if (lookupData && lookupData.length > 0) {
              recipientUserId = lookupData[0].user_id;
              console.log('Found recipient user ID:', recipientUserId, 'for email:', lookupData[0].email);
            } else {
              console.log('No user found for email:', trimmedEmail);
              Alert.alert(
                t('error'),
                `The recipient with email "${selectedRecipient.email}" is not a registered user. Please ensure they have signed up before sending money.`
              );
              return;
            }
          } catch (error) {
            console.error('Exception looking up recipient:', error);
            Alert.alert(
              t('error'),
              'Unable to verify recipient. Please try again.'
            );
            return;
          }
        } else {
          console.log('Cannot lookup recipient - Supabase configured:', isSupabaseConfigured, 'Email:', selectedRecipient.email);
          if (isSupabaseConfigured && !selectedRecipient.email) {
            Alert.alert(
              t('error'),
              'Recipient email is required for transfers.'
            );
            return;
          }
        }
        
        console.log('Creating transfer with recipient_user_id:', recipientUserId);
        
        const result = await addTransfer({
          recipient_id: selectedRecipient.id,
          recipient_user_id: recipientUserId,
          recipient_name: selectedRecipient.name,
          amount: parseFloat(amount),
          fee: parseFloat(convertedFee.toFixed(2)),
          source_currency: sourceCurrency,
          target_currency: currentRate?.currency || 'GHS',
          exchange_rate: currentRate?.rate || 1,
          payment_method: selectedMethod?.name || 'Bank Transfer',
          transfer_time: selectedMethod?.transferTime || '1-2 business days',
          institution_name: selectedMethod?.name,
          institution_id: selectedMethod?.id
        });
        
        if (result?.error) {
          Alert.alert("Transfer Failed", result.error, [
            { text: t('ok') }
          ]);
          return;
        }
        
        Alert.alert("Transfer Initiated", "Your money transfer has been initiated successfully!", [
          { text: t('ok'), onPress: () => {
            if (cameFromRecipients) {
              router.push('/(tabs)/recipients');
            } else {
              router.back();
            }
          }},
        ]);
      }

    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      testID="sendMoneyScreen"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.progressContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: ((step / 4) * 100) + '%' }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>Step {step} of 4</Text>
        </View>

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{t('selectRecipient')}</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>{t('chooseRecipientDesc')}</Text>

            <TouchableOpacity style={[styles.addRecipientCard, { backgroundColor: isDark ? colors.card : '#EBF5FF', borderColor: PanAfrican.green }]} onPress={() => router.push("/add-recipient")} testID="addRecipientCTA">
              <Text style={styles.addRecipientText}>{t('addNewRecipient')}</Text>
            </TouchableOpacity>

            {recipients.map((recipient: RecipientType) => (
              <TouchableOpacity
                key={recipient.id}
                style={[styles.recipientOption, { backgroundColor: colors.card, borderColor: selectedRecipient?.id === recipient.id ? PanAfrican.green : 'transparent' }, selectedRecipient?.id === recipient.id && { backgroundColor: isDark ? colors.backgroundSecondary : '#D1FAE5' }]}
                onPress={() => {
                  setSelectedRecipient(recipient);
                  setSelectedCountry(recipient.country);
                }}
                testID={'recipient-' + recipient.id}
              >
                <View style={styles.recipientInfo}>
                  <Text style={[styles.recipientName, { color: colors.text }]}>{recipient.name}</Text>
                  <Text style={[styles.recipientDetails, { color: colors.textSecondary }]}>
                    {recipient.flag} {recipient.country} • {recipient.phone}
                  </Text>
                </View>
                {selectedRecipient?.id === recipient.id && (
                  <View style={styles.checkmark}>
                    <Text style={{ color: "#fff" }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{t('enterAmount')}</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>{t('howMuchSend')}</Text>
            
            {selectedRecipient && (
              <View style={[styles.selectedRecipientCard, { backgroundColor: colors.card }]}>
                <View style={styles.selectedRecipientInfo}>
                  <View style={[styles.selectedRecipientAvatar, { backgroundColor: isDark ? colors.primary + '30' : '#EBF5FF' }]}>
                    <Text style={[styles.selectedRecipientInitial, { color: colors.primary }]}>{selectedRecipient.name[0]}</Text>
                  </View>
                  <View>
                    <Text style={[styles.selectedRecipientName, { color: colors.text }]}>{selectedRecipient.name}</Text>
                    <Text style={[styles.selectedRecipientDetails, { color: colors.textSecondary }]}>
                      {selectedRecipient.flag} {selectedRecipient.country} • {selectedRecipient.phone}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={[styles.amountCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.currencyLabel, { color: colors.textSecondary }]}>{t('youSend')}</Text>
              <View style={styles.amountInputContainer}>
                <Text style={[styles.currencySymbol, { color: colors.text }]}>{sourceSymbol}</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.text }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  testID="amountInput"
                />
                <Text style={[styles.currencyCode, { color: colors.textSecondary }]}>{sourceCurrency}</Text>
              </View>

              <View style={styles.currencyRow}>
                {SOURCE_CURRENCIES.map((c) => (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.currencyChip, { backgroundColor: isDark ? colors.backgroundSecondary : '#F3F4F6' }, sourceCurrency === c.code && { backgroundColor: isDark ? colors.backgroundSecondary : '#D1FAE5', borderWidth: 1, borderColor: PanAfrican.green }]}
                    onPress={() => setSourceCurrency(c.code)}
                    testID={'currency-' + c.code}
                  >
                    <Text style={[{ color: colors.text, fontWeight: '500' }, sourceCurrency === c.code && { color: PanAfrican.green }]}>
                      {c.symbol} {c.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.exchangeInfo, { backgroundColor: colors.card }]}>
              <View style={styles.exchangeRow}>
                <Text style={[styles.exchangeLabel, { color: colors.textSecondary }]}>{t('exchangeRate')}</Text>
                <Text style={[styles.exchangeValue, { color: colors.text }]}>1 USD = {currentRate?.rate ?? "-"} {currentRate?.currency ?? "-"}</Text>
              </View>
              <View style={styles.exchangeRow}>
                <Text style={[styles.exchangeLabel, { color: colors.textSecondary }]}>{t('transferFee')}</Text>
                <Text style={[styles.exchangeValue, { color: colors.text }]}>{sourceSymbol}
                  {convertedFee.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.exchangeRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>{t('totalToPay')}</Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>
                  {sourceSymbol}
                  {total.toFixed(2)} {sourceCurrency}
                </Text>
              </View>
            </View>

            <View style={styles.receiveCard}>
              <Text style={[styles.currencyLabel, { color: '#fff', opacity: 0.9 }]}>{t('theyReceive')}</Text>
              <View style={styles.receiveAmount}>
                <Text style={styles.receiveValue}>{receivingAmount || "0.00"}</Text>
                <Text style={styles.receiveCurrency}>{currentRate?.currency ?? ""}</Text>
              </View>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{t('choosePaymentMethod')}</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>{t('howToSendMoney')}</Text>

            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[styles.paymentOption, { backgroundColor: colors.card, borderColor: selectedPaymentMethod === method.id ? PanAfrican.green : 'transparent' }, selectedPaymentMethod === method.id && { backgroundColor: isDark ? colors.backgroundSecondary : '#D1FAE5' }]}
                onPress={() => setSelectedPaymentMethod(method.id)}
                testID={'payment-' + method.id}
              >
                <View style={styles.paymentLeft}>
                  <View style={styles.paymentIcon}>
                    {method.icon}
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.paymentName, { color: colors.text }]}>{method.name}</Text>
                    <Text style={[styles.paymentDescription, { color: colors.textSecondary }]}>{method.description}</Text>
                  </View>
                </View>
                <View style={styles.paymentRight}>
                  <View style={styles.transferTimeContainer}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={[styles.transferTime, { color: colors.textSecondary }]}>{method.transferTime}</Text>
                  </View>
                  {selectedPaymentMethod === method.id && (
                    <View style={styles.checkmark}>
                      <Text style={{ color: "#fff" }}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              style={[styles.scheduleOption, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setIsScheduled(!isScheduled)}
              testID="scheduleOption"
            >
              <View style={styles.scheduleLeft}>
                <Calendar size={20} color={PanAfrican.green} />
                <Text style={[styles.scheduleText, { color: colors.text }]}>{t('schedulePayment')}</Text>
              </View>
              {isScheduled ? (
                <CheckSquare size={20} color={PanAfrican.green} />
              ) : (
                <Square size={20} color="#6B7280" />
              )}
            </TouchableOpacity>

            {isScheduled && (
              <View style={[styles.datePickerContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>{t('selectTransferDate')}</Text>
                <TextInput
                  style={[styles.dateInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  testID="scheduledDateInput"
                />
              </View>
            )}

            <View style={[styles.preferredMethodCard, { backgroundColor: isDark ? colors.backgroundSecondary : '#ECFDF5' }]}>
              <Info size={16} color={PanAfrican.green} />
              <Text style={styles.preferredMethodText}>
                Your selected method will be saved as preferred for future transfers
              </Text>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{t('reviewConfirm')}</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>{t('reviewTransferDetails')}</Text>

            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('recipient')}</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{selectedRecipient?.name ?? ""}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('country')}</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{currentRate?.flag} {selectedCountry}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('amountToSend')}</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {sourceSymbol}
                  {amount} {sourceCurrency}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('transferFee')}</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {sourceSymbol}
                  {convertedFee.toFixed(2)} {sourceCurrency}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('paymentMethod')}</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{selectedMethod?.name}</Text>
              </View>
              {isScheduled && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('scheduledDate')}</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{scheduledDate}</Text>
                </View>
              )}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryTotalLabel, { color: colors.text }]}>{t('total')}</Text>
                <Text style={[styles.summaryTotalValue, { color: colors.text }]}>
                  {sourceSymbol}
                  {total.toFixed(2)} {sourceCurrency}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('theyReceive')}</Text>
                <Text style={styles.summaryReceiveValue}>
                  {receivingAmount} {currentRate?.currency ?? ""}
                </Text>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: isDark ? colors.backgroundSecondary : '#ECFDF5' }]}>
              {isScheduled ? (
                <>
                  <Calendar size={16} color={PanAfrican.green} />
                  <Text style={styles.infoText}>Transfer will be executed on {scheduledDate}</Text>
                </>
              ) : (
                <>
                  <Clock size={16} color={PanAfrican.green} />
                  <Text style={styles.infoText}>Transfer will be completed {selectedMethod?.transferTime.toLowerCase()}</Text>
                </>
              )}
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {step > 1 ? (
            <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setStep((s) => s - 1)} testID="backBtn">
              <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>{t('back')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {
              if (cameFromRecipients) {
                router.push('/(tabs)/recipients');
              } else {
                router.back();
              }
            }} testID="backToRecipientsBtn">
              <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>{t('back')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.continueButton, step > 1 && styles.continueButtonFlex]}
            onPress={() => {
              console.log('Continue button pressed, step:', step, 'amount:', amount);
              handleContinue();
            }}
            testID="continueBtn"
          >
            <Text style={styles.continueButtonText}>{step === 4 ? (isScheduled ? t('scheduleTransfer') : t('confirmTransfer')) : t('continue')}</Text>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  progressContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: PanAfrican.green,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  stepContainer: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  addRecipientCard: {
    backgroundColor: "#EBF5FF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PanAfrican.green,
    borderStyle: "dashed",
  },
  addRecipientText: {
    fontSize: 16,
    fontWeight: "500",
    color: PanAfrican.green,
  },
  recipientOption: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  recipientOptionSelected: {
    borderColor: PanAfrican.green,
    backgroundColor: "#D1FAE5",
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  recipientDetails: {
    fontSize: 14,
    color: "#6B7280",
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PanAfrican.green,
    alignItems: "center",
    justifyContent: "center",
  },
  amountCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  currencyLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "600",
    color: "#1F2937",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "600",
    color: "#1F2937",
  },
  currencyCode: {
    fontSize: 16,
    color: "#6B7280",
    marginLeft: 8,
  },
  currencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  currencyChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  currencyChipActive: {
    backgroundColor: "#D1FAE5",
    borderWidth: 1,
    borderColor: PanAfrican.green,
  },
  currencyChipText: {
    color: "#374151",
    fontWeight: "500",
  },
  currencyChipTextActive: {
    color: PanAfrican.green,
  },
  exchangeInfo: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  exchangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  exchangeLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  exchangeValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  receiveCard: {
    backgroundColor: PanAfrican.green,
    padding: 20,
    borderRadius: 12,
  },
  receiveAmount: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  receiveValue: {
    fontSize: 32,
    fontWeight: "600",
    color: "#fff",
  },
  receiveCurrency: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  summaryCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  summaryReceiveValue: {
    fontSize: 16,
    fontWeight: "600",
    color: PanAfrican.green,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: PanAfrican.green,
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  continueButton: {
    backgroundColor: PanAfrican.black,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continueButtonFlex: {
    flex: 1,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  paymentOption: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  paymentOptionSelected: {
    borderColor: PanAfrican.green,
    backgroundColor: "#D1FAE5",
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  paymentRight: {
    alignItems: "flex-end",
  },
  transferTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  transferTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  preferredMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 16,
  },
  preferredMethodText: {
    flex: 1,
    fontSize: 14,
    color: PanAfrican.green,
  },
  scheduleOption: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scheduleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scheduleText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  selectedRecipientCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PanAfrican.green,
  },
  selectedRecipientInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedRecipientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedRecipientInitial: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectedRecipientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  selectedRecipientDetails: {
    fontSize: 14,
  },
});