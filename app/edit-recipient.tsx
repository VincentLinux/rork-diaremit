import React, { useState, useEffect } from "react";
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
import { ChevronDown } from "lucide-react-native";
import { useTransfer } from "@/providers/TransferProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";

export default function EditRecipientScreen() {
  const params = useLocalSearchParams();
  const { recipients, updateRecipient } = useTransfer();
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("Ghana");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const countries = [
    { name: "Ghana", flag: "🇬🇭", code: "+233" },
    { name: "Kenya", flag: "🇰🇪", code: "+254" },
    { name: "Senegal", flag: "🇸🇳", code: "+221" },
    { name: "Uganda", flag: "🇺🇬", code: "+256" },
  ];

  const selectedCountryData = countries.find(c => c.name === country);

  useEffect(() => {
    const recipientId = params.recipientId as string;
    if (recipientId) {
      const recipient = recipients.find(r => r.id === recipientId);
      if (recipient) {
        setName(recipient.name);
        setPhone(recipient.phone);
        setEmail(recipient.email || "");
        setCountry(recipient.country);
        setBank(recipient.bank || "");
        setAccountNumber(recipient.account_number || "");
      }
    }
  }, [params.recipientId, recipients]);

  const handleSave = async () => {
    if (!name || !phone || !country) {
      Alert.alert(t('error'), "Please fill in all required fields");
      return;
    }

    const recipientId = params.recipientId as string;
    if (!recipientId) {
      Alert.alert(t('error'), "Recipient ID not found");
      return;
    }

    const result = await updateRecipient(recipientId, {
      name,
      phone,
      email: email || undefined,
      country,
      flag: selectedCountryData?.flag || "",
      bank: bank || undefined,
      account_number: accountNumber || undefined,
    });

    if (result?.error) {
      Alert.alert(t('error'), result.error);
      return;
    }

    Alert.alert(
      t('success'),
      "Recipient updated successfully!",
      [{ text: t('ok'), onPress: () => router.back() }]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('personalInformation')}</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('fullName')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder={t('enterFullName')}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('country')} *</Text>
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowCountryPicker(!showCountryPicker)}
            >
              <View style={styles.dropdownContent}>
                <Text style={[styles.dropdownText, { color: colors.text }]}>
                  {selectedCountryData?.flag} {country}
                </Text>
                <ChevronDown size={20} color="#6B7280" />
              </View>
            </TouchableOpacity>
            
            {showCountryPicker && (
              <View style={[styles.dropdownOptions, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {countries.map((c) => (
                  <TouchableOpacity
                    key={c.name}
                    style={[styles.dropdownOption, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setCountry(c.name);
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text style={[styles.dropdownOptionText, { color: colors.text }]}>
                      {c.flag} {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('phoneNumber')} *</Text>
            <View style={styles.phoneInputContainer}>
              <View style={[styles.phoneCode, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <Text style={[styles.phoneCodeText, { color: colors.text }]}>
                  {selectedCountryData?.code}
                </Text>
              </View>
              <TextInput
                style={[styles.phoneInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder={t('enterPhoneNumber')}
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('emailAddress')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder={t('enterEmailOptional')}
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 32, color: colors.text }]}>
            {t('bankInformation')}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('bankName')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={bank}
              onChangeText={setBank}
              placeholder={t('enterBankName')}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('accountNumber')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder={t('enterAccountNumber')}
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>{t('saveRecipient')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  form: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  dropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownOptions: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  phoneCode: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
  },
  phoneCodeText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1B4B8C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});