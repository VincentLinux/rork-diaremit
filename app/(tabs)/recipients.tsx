import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Plus, Search, Edit2, Trash2 } from "lucide-react-native";
import { useTransfer } from "@/providers/TransferProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";

export default function RecipientsScreen() {
  const { recipients, deleteRecipient } = useTransfer();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const handleDeleteRecipient = (recipientId: string, recipientName: string) => {
    Alert.alert(
      t('deleteRecipient') || 'Delete Recipient',
      `Are you sure you want to delete ${recipientName}?`,
      [
        {
          text: t('cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteRecipient(recipientId);
            if (result?.error) {
              Alert.alert(t('error') || 'Error', result.error);
            }
          },
        },
      ]
    );
  };

  const filteredRecipients = recipients.filter(recipient =>
    recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipient.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedRecipients = filteredRecipients.reduce((acc, recipient) => {
    const firstLetter = recipient.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(recipient);
    return acc;
  }, {} as Record<string, typeof recipients>);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('searchRecipients')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      {/* Add Recipient Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/add-recipient")}
        activeOpacity={0.8}
      >
        <Plus size={20} color="#fff" />
        <Text style={styles.addButtonText}>{t('addNewRecipient')}</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {Object.keys(groupedRecipients).sort().map(letter => (
          <View key={letter} style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{letter}</Text>
            {groupedRecipients[letter].map(recipient => (
              <TouchableOpacity
                key={recipient.id}
                style={[styles.recipientCard, { backgroundColor: colors.card }]}
                onPress={() => router.push({
                  pathname: "/send-money",
                  params: { recipientId: recipient.id }
                })}
              >
                <View style={styles.recipientLeft}>
                  <View style={[styles.avatar, { backgroundColor: isDark ? colors.primary + '30' : '#EBF5FF' }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{recipient.name[0]}</Text>
                  </View>
                  <View style={styles.recipientInfo}>
                    <Text style={[styles.recipientName, { color: colors.text }]}>{recipient.name}</Text>
                    <Text style={[styles.recipientDetails, { color: colors.textSecondary }]}>
                      {recipient.flag} {recipient.country} • {recipient.phone}
                    </Text>
                    {recipient.bank && (
                      <Text style={[styles.recipientBank, { color: colors.textSecondary }]}>{recipient.bank}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.recipientActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({
                        pathname: "/edit-recipient",
                        params: { recipientId: recipient.id }
                      });
                    }}
                  >
                    <Edit2 size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#FEE2E2' }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteRecipient(recipient.id, recipient.name);
                    }}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {filteredRecipients.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>{t('noRecipientsFound')}</Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/add-recipient")}
            >
              <Text style={styles.emptyStateButtonText}>{t('addFirstRecipient')}</Text>
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
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  recipientCard: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  recipientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recipientDetails: {
    fontSize: 13,
    marginBottom: 2,
  },
  recipientBank: {
    fontSize: 12,
  },
  recipientActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    marginBottom: 16,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});