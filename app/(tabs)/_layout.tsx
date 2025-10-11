import { Tabs, router } from "expo-router";
import { Home, Clock, Users, User, LineChart, Headset, BarChart3, LogOut } from "lucide-react-native";
import React, { useState } from "react";
import { Platform, View, Text, TouchableOpacity, Alert, Modal, StyleSheet } from "react-native";

import { PanAfrican } from "@/constants/colors";
import { useLanguage } from "@/providers/LanguageProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";

export default function TabLayout() {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const { user, profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  const handleSignOut = async () => {
    setShowUserMenu(false);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await signOut();
              if (result.error) {
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              } else {
                // Redirect to welcome screen after successful sign out
                router.replace('/');
              }
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getUserDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0]; // First name only
    }
    if (user?.email) {
      return user.email.split('@')[0]; // Username from email
    }
    return 'User';
  };

  const UserIndicator = () => (
    <TouchableOpacity
      style={styles.userIndicator}
      onPress={() => setShowUserMenu(true)}
      activeOpacity={0.7}
    >
      <View style={[styles.userAvatar, { backgroundColor: PanAfrican.green }]}>
        <Text style={styles.userInitial}>
          {getUserDisplayName().charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
        {getUserDisplayName()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tabIconSelected,
          tabBarInactiveTintColor: colors.tabIconDefault,
          headerShown: true,
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundTertiary : PanAfrican.black,
          },
          headerTintColor: colors.text,
          headerRight: () => <UserIndicator />,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          animation: Platform.OS === 'ios' ? 'shift' : 'none',
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t('home'),
            headerTitle: "DiaRemit",
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: t('historyTab'),
            headerTitle: t('historyTab'),
            tabBarIcon: ({ color }) => <Clock size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="recipients"
          options={{
            title: t('recipients'),
            headerTitle: t('recipients'),
            tabBarIcon: ({ color }) => <Users size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="market"
          options={{
            title: t('market'),
            headerTitle: t('market'),
            tabBarIcon: ({ color }) => <LineChart size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="support"
          options={{
            title: t('support'),
            headerTitle: t('support'),
            tabBarIcon: ({ color }) => <Headset size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('profile'),
            headerTitle: t('profile'),
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="live-rates"
          options={{
            title: "Live Rates",
            headerTitle: "Live Rates",
            tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
            href: null, // Hide from tab bar but keep accessible
          }}
        />
      </Tabs>
      
      {/* User Menu Modal */}
      <Modal
        visible={showUserMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.userInfo}>
              <View style={[styles.userAvatarLarge, { backgroundColor: PanAfrican.green }]}>
                <Text style={styles.userInitialLarge}>
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.userNameLarge, { color: colors.text }]}>
                {getUserDisplayName()}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {user?.email}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: PanAfrican.red }]}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <LogOut size={20} color="#fff" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowUserMenu(false)}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  userIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    maxWidth: 120,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userInitial: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500' as const,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userAvatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userInitialLarge: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600' as const,
  },
  userNameLarge: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    textAlign: 'center' as const,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    gap: 8,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
});