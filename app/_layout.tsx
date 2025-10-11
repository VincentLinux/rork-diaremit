import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TransferProvider } from "@/providers/TransferProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { BalanceProvider } from "@/providers/BalanceProvider";
import { PanAfrican } from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Back",
      animation: Platform.OS === 'ios' ? 'slide_from_right' : 'none',
      animationTypeForReplace: Platform.OS === 'ios' ? 'push' : 'push',
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="send-money" 
        options={{ 
          title: "Send Money",
          headerStyle: { backgroundColor: PanAfrican.black },
          headerTintColor: '#fff',
          animation: Platform.OS === 'ios' ? 'slide_from_right' : 'none',
        }} 
      />
      <Stack.Screen 
        name="add-recipient" 
        options={{ 
          title: "Add Recipient",
          presentation: "modal",
          headerStyle: { backgroundColor: PanAfrican.black },
          headerTintColor: '#fff',
        }} 
      />
      <Stack.Screen 
        name="edit-recipient" 
        options={{ 
          title: "Edit Recipient",
          presentation: "modal",
          headerStyle: { backgroundColor: PanAfrican.black },
          headerTintColor: '#fff',
        }} 
      />
      <Stack.Screen 
        name="transaction-details" 
        options={{ 
          title: "Transaction Details",
          headerStyle: { backgroundColor: PanAfrican.black },
          headerTintColor: '#fff',
          animation: Platform.OS === 'ios' ? 'slide_from_right' : 'none',
        }} 
      />
      <Stack.Screen 
        name="scheduled-transfers" 
        options={{ 
          title: "Scheduled Transfers",
          headerStyle: { backgroundColor: PanAfrican.black },
          headerTintColor: '#fff',
          animation: Platform.OS === 'ios' ? 'slide_from_right' : 'none',
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <AuthProvider>
          <BalanceProvider>
            <LanguageProvider>
              <ThemeProvider>
                <TransferProvider>
                  <RootLayoutNav />
                </TransferProvider>
              </ThemeProvider>
            </LanguageProvider>
          </BalanceProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}