import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Platform,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { router, Redirect } from 'expo-router';
import { PanAfrican, Colors } from '@/constants/colors';
import { Check, ChevronDown } from 'lucide-react-native';
import * as Localization from 'expo-localization';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';

type Language = 'en' | 'sv' | 'fr' | 'no' | 'dk';

const languages = [
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'sv' as Language, name: 'Svenska', flag: '🇸🇪' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'no' as Language, name: 'Norsk', flag: '🇳🇴' },
  { code: 'dk' as Language, name: 'Dansk', flag: '🇩🇰' },
];

const translations = {
  en: {
    welcome: 'Welcome to',
    appName: 'DiaRemit',
    subtitle: 'AI-powered money transfers to Africa',
    getStarted: 'Get Started',
    takeTour: 'Take a Tour',
    fastTransfers: 'Fast Transfers',
    aiPoweredRates: 'AI-Powered Rates',
    secure: 'Secure',
  },
  no: {
    welcome: 'Velkommen til',
    appName: 'DiaRemit',
    subtitle: 'AI-drevne pengeoverføringer til Afrika',
    getStarted: 'Kom i gang',
    takeTour: 'Ta en omvisning',
    fastTransfers: 'Raske overføringer',
    aiPoweredRates: 'AI-drevne kurser',
    secure: 'Sikker',
  },
  dk: {
    welcome: 'Velkommen til',
    appName: 'DiaRemit',
    subtitle: 'AI-drevne pengeoverførsler til Afrika',
    getStarted: 'Kom i gang',
    takeTour: 'Tag en rundtur',
    fastTransfers: 'Hurtige overførsler',
    aiPoweredRates: 'AI-drevne kurser',
    secure: 'Sikker',
  },
  sv: {
    welcome: 'Välkommen till',
    appName: 'DiaRemit',
    subtitle: 'AI-drivna penningöverföringar till Afrika',
    getStarted: 'Kom igång',
    takeTour: 'Ta en rundtur',
    fastTransfers: 'Snabba överföringar',
    aiPoweredRates: 'AI-drivna kurser',
    secure: 'Säker',
  },
  fr: {
    welcome: 'Bienvenue chez',
    appName: 'DiaRemit',
    subtitle: 'Transferts d\'argent alimentés par IA vers l\'Afrique',
    getStarted: 'Commencer',
    takeTour: 'Faire le tour',
    fastTransfers: 'Transferts rapides',
    aiPoweredRates: 'Taux alimentés par IA',
    secure: 'Sécurisé',
  },

};

function getDeviceLanguage(): Language {
  try {
    const locales = Localization.getLocales();
    const deviceLocale = locales[0]?.languageCode || 'en';
    const languageCode = deviceLocale.split('-')[0].toLowerCase();
    
    // Map device language to supported languages
    const languageMap: { [key: string]: Language } = {
      'en': 'en',
      'sv': 'sv', 
      'fr': 'fr',
      'no': 'no',
      'nb': 'no', // Norwegian Bokmål
      'nn': 'no', // Norwegian Nynorsk
      'da': 'dk', // Danish
      'dk': 'dk',
    };
    
    return languageMap[languageCode] || 'en';
  } catch (error) {
    console.log('Error getting device language:', error);
    return 'en';
  }
}

export default function WelcomeScreen() {
  const { setLanguage } = useLanguage();
  const { session, loading } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(getDeviceLanguage());
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = useRef(new Animated.Value(100)).current;
  
  const t = useCallback((key: string): string => {
    return translations[selectedLanguage][key as keyof typeof translations[typeof selectedLanguage]] || key;
  }, [selectedLanguage]);
  
  useEffect(() => {
    // Set device language as default
    const deviceLang = getDeviceLanguage();
    setSelectedLanguage(deviceLang);
    setLanguage(deviceLang);
    
    // Start animations only if not loading and not authenticated
    if (!loading && !session) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        // Show buttons after main animation
        Animated.parallel([
          Animated.timing(buttonFadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(buttonSlideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();
      });
    }
  }, [fadeAnim, slideAnim, buttonFadeAnim, buttonSlideAnim, setLanguage, session, loading]);
  
  const handleLanguageSelect = (language: Language) => {
    try {
      if (!language) {
        console.log('No language provided');
        return;
      }
      
      const validLanguages: Language[] = ['en', 'sv', 'fr', 'no', 'dk'];
      
      let sanitizedLanguage: Language;
      if (typeof language === 'string') {
        const trimmed = language.trim().toLowerCase() as Language;
        if (trimmed.length > 10) {
          console.log('Language code too long:', trimmed);
          return;
        }
        if (!validLanguages.includes(trimmed)) {
          console.log('Invalid language:', trimmed);
          return;
        }
        sanitizedLanguage = trimmed;
      } else {
        console.log('Invalid language type:', typeof language);
        return;
      }
      
      setSelectedLanguage(sanitizedLanguage);
      setLanguage(sanitizedLanguage);
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error selecting language:', error);
    }
  };
  
  const handleGetStarted = () => {
    router.push('/auth');
  };
  
  const handleTakeTour = () => {
    // TODO: Implement tour functionality
    router.push('/auth');
  };

  const selectedLang = languages.find(lang => lang.code === selectedLanguage) || languages[0];

  // Show loading state while checking authentication
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: PanAfrican.black }]}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }
  
  // Redirect authenticated users to home
  if (session) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image
        source={{ uri: 'https://r2-pub.rork.com/generated-images/2744fe40-6515-4df9-b6dd-7a71b7dd9284.png' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Gradient Overlay */}
      <View style={styles.overlay} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Language Dropdown */}
        <View style={styles.languageDropdownContainer}>
          <TouchableOpacity
            style={styles.languageDropdown}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.languageFlag}>{selectedLang.flag}</Text>
            <ChevronDown size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          {/* Header */}
          <Animated.View style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <Text style={styles.welcomeText}>{t('welcome')}</Text>
            <Text style={styles.appName}>{t('appName')}</Text>
            <Text style={styles.subtitle}>{t('subtitle')}</Text>
          </Animated.View>
          
          {/* Features */}
          <Animated.View style={[
            styles.featuresContainer,
            {
              opacity: buttonFadeAnim,
              transform: [{ translateY: buttonSlideAnim }]
            }
          ]}>
            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: PanAfrican.green + '20' }]}>
                <Text style={styles.featureEmoji}>⚡</Text>
              </View>
              <Text style={styles.featureText}>{t('fastTransfers')}</Text>
            </View>
            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: PanAfrican.gold + '20' }]}>
                <Text style={styles.featureEmoji}>🤖</Text>
              </View>
              <Text style={styles.featureText}>{t('aiPoweredRates')}</Text>
            </View>
            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: PanAfrican.red + '20' }]}>
                <Text style={styles.featureEmoji}>🔒</Text>
              </View>
              <Text style={styles.featureText}>{t('secure')}</Text>
            </View>
          </Animated.View>
          
          {/* Buttons */}
          <Animated.View style={[
            styles.buttonContainer,
            {
              opacity: buttonFadeAnim,
              transform: [{ translateY: buttonSlideAnim }]
            }
          ]}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: PanAfrican.green }]}
              onPress={handleGetStarted}
              testID="getStartedButton"
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{t('getStarted')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleTakeTour}
              testID="takeTourButton"
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>{t('takeTour')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
      
      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <ScrollView style={styles.languageList}>
              {languages.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageOption,
                      {
                        backgroundColor: isSelected ? PanAfrican.green + '15' : 'transparent',
                        borderColor: isSelected ? PanAfrican.green : 'rgba(0,0,0,0.1)',
                      }
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.languageContent}>
                      <Text style={styles.flagEmoji}>{lang.flag}</Text>
                      <Text style={[
                        styles.languageName,
                        { color: isSelected ? PanAfrican.green : Colors.light.text }
                      ]}>
                        {lang.name}
                      </Text>
                    </View>
                    
                    {isSelected && (
                      <View style={[styles.checkContainer, { backgroundColor: PanAfrican.green }]}>
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
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
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  safeArea: {
    flex: 1,
  },
  languageDropdownContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  languageDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  languageFlag: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: '20%',
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    paddingHorizontal: 20,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
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
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    marginBottom: 20,
    color: Colors.light.text,
  },
  languageList: {
    maxHeight: 300,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.light.textSecondary,
  },
});