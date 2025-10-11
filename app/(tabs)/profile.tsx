import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { 
  User, 
  Bell, 
  Shield, 
  FileText,
  LogOut,
  ChevronRight,
  CreditCard,
  Globe,
  Check,
  X,
  Trash2
} from "lucide-react-native";
import { PanAfrican } from "@/constants/colors";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage, Language } from "@/providers/LanguageProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useTransfer } from "@/providers/TransferProvider";
import { router } from "expo-router";



const languages = [
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'sv' as Language, name: 'Svenska', flag: '🇸🇪' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'no' as Language, name: 'Norsk', flag: '🇳🇴' },
  { code: 'dk' as Language, name: 'Dansk', flag: '🇩🇰' },
];

export default function ProfileScreen() {
  const { colors, setTheme, isDark } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { signOut, user, profile, deleteAccount } = useAuth();
  const { recipients, recentTransfers } = useTransfer();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  const getInitials = (name?: string | null, email?: string | null): string => {
    if (name) {
      const names = name.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      t('deleteAccount') || 'Delete Account',
      t('deleteAccountConfirm') || 'Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data.',
      [
        {
          text: t('cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('delete') || 'Delete',
          style: 'destructive',
          onPress: () => setShowDeleteModal(true),
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const { error } = await deleteAccount();
      
      if (error) {
        Alert.alert(
          t('error') || 'Error',
          error.message || 'Failed to delete account'
        );
        return;
      }
      
      setShowDeleteModal(false);
      router.replace('/');
    } catch {
      Alert.alert(
        t('error') || 'Error',
        'An unexpected error occurred'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  type MenuItem = {
    icon: any;
    label: string;
    action?: () => void;
    toggle?: boolean;
    value?: boolean;
    onToggle?: (value: boolean) => void;
    showFAQ?: boolean;
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: t('account'),
      items: [
        { icon: User, label: t('personalInfo'), action: () => {} },
        { icon: CreditCard, label: t('paymentMethods'), action: () => {} },
        { 
          icon: Globe, 
          label: t('languageRegion'), 
          action: () => {
            setSelectedLanguage(language);
            setShowLanguageModal(true);
          }
        },
      ]
    },
    {
      title: t('security'),
      items: [
        { icon: Shield, label: t('securitySettings'), action: () => {} },
        { 
          icon: Bell, 
          label: t('pushNotifications'), 
          toggle: true,
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled
        },
        { 
          icon: Shield, 
          label: t('biometricLogin'), 
          toggle: true,
          value: biometricsEnabled,
          onToggle: setBiometricsEnabled
        },
        { 
          icon: Globe, 
          label: t('darkMode'), 
          toggle: true,
          value: isDark,
          onToggle: (value: boolean) => setTheme(value ? 'dark' : 'light')
        },
      ]
    },
    {
      title: t('legal'),
      items: [
        { icon: FileText, label: t('termsConditions'), action: () => {} },
        { icon: Shield, label: t('privacyPolicy'), action: () => {} },
      ]
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>
              {getInitials(profile?.full_name, user?.email)}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {profile?.full_name || user?.email?.split('@')[0] || 'User'}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {user?.email || 'user@example.com'}
          </Text>
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {recentTransfers.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('transfers')}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {recipients.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('recipients')}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <View key={`${section.title}-${item.label}`}>
                    <TouchableOpacity
                      style={[
                        styles.menuItem,
                        itemIndex < section.items.length - 1 && [styles.menuItemBorder, { borderBottomColor: colors.borderLight }]
                      ]}
                      onPress={item.action}
                      disabled={!!item.toggle}
                    >
                      <View style={styles.menuItemLeft}>
                        <View style={[styles.menuIconContainer, { backgroundColor: colors.primary + '20' }]}>
                          <Icon size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.menuItemText, { color: colors.text }]}>{item.label}</Text>
                      </View>
                      {item.toggle ? (
                        <Switch
                          value={item.value}
                          onValueChange={item.onToggle}
                          trackColor={{ false: colors.border, true: colors.primary }}
                          thumbColor="#fff"
                        />
                      ) : (
                        <ChevronRight size={20} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>

                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Delete Account Button */}
        <TouchableOpacity 
          style={[styles.deleteButton, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}
          activeOpacity={0.7}
          onPress={handleDeleteAccount}
        >
          <Trash2 size={20} color={isDark ? '#FCA5A5' : '#EF4444'} />
          <Text style={[styles.deleteText, { color: isDark ? '#FCA5A5' : '#EF4444' }]}>
            {t('deleteAccount') || 'Delete Account'}
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}
          activeOpacity={0.7}
          onPress={async () => {
            try {
              await signOut();
              router.replace('/');
            } catch (error) {
              console.error('Sign out error:', error);
            }
          }}
        >
          <LogOut size={20} color={isDark ? '#FCA5A5' : '#EF4444'} />
          <Text style={[styles.logoutText, { color: isDark ? '#FCA5A5' : '#EF4444' }]}>{t('logOut')}</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>{t('version')} 1.0.0</Text>
      </ScrollView>
      
      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('selectLanguage')}
            </Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {t('chooseLanguage')}
            </Text>
            
            <View style={styles.languageList}>
              {languages.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageItem,
                      {
                        backgroundColor: isSelected 
                          ? colors.primary + '15'
                          : colors.card,
                        borderColor: isSelected 
                          ? colors.primary
                          : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      }
                    ]}
                    onPress={() => setSelectedLanguage(lang.code)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.languageItemContent}>
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <Text style={[styles.languageItemName, { 
                        color: isSelected ? colors.primary : colors.text,
                        fontWeight: isSelected ? '600' : '500'
                      }]}>
                        {lang.name}
                      </Text>
                    </View>
                    
                    {isSelected && (
                      <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <TouchableOpacity
              style={[styles.saveButton, { 
                backgroundColor: selectedLanguage ? colors.primary : colors.border,
                opacity: selectedLanguage ? 1 : 0.6
              }]}
              onPress={async () => {
                if (selectedLanguage) {
                  await setLanguage(selectedLanguage);
                  setShowLanguageModal(false);
                }
              }}
              disabled={!selectedLanguage}
              activeOpacity={0.8}
            >
              <Text style={[styles.saveButtonText, {
                color: selectedLanguage ? '#FFFFFF' : colors.textSecondary
              }]}>
                {t('continue')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.deleteModalHeader}>
              <View style={[styles.deleteModalIcon, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
                <Trash2 size={24} color={isDark ? '#FCA5A5' : '#EF4444'} />
              </View>
              <Text style={[styles.deleteModalTitle, { color: colors.text }]}>
                {t('deleteAccount') || 'Delete Account'}
              </Text>
              <Text style={[styles.deleteModalSubtitle, { color: colors.textSecondary }]}>
                {t('deleteAccountWarning') || 'This will permanently delete your account and all associated data. This action cannot be undone.'}
              </Text>
            </View>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  {t('cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmDeleteButton, { 
                  backgroundColor: isDark ? '#7F1D1D' : '#EF4444',
                  opacity: isDeleting ? 0.6 : 1
                }]}
                onPress={confirmDeleteAccount}
                disabled={isDeleting}
              >
                <Text style={styles.confirmDeleteButtonText}>
                  {isDeleting ? (t('deleting') || 'Deleting...') : (t('delete') || 'Delete')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PanAfrican.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  profileInitial: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 24,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  menuItemText: {
    fontSize: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  languageList: {
    marginBottom: 32,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    minHeight: 60,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  languageItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageItemName: {
    fontSize: 16,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteModalContainer: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  deleteModalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    // backgroundColor set dynamically
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    // backgroundColor set dynamically
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});