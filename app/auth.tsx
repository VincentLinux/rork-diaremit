import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Mail, Lock, User, Phone, Globe } from 'lucide-react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmingEmail, setConfirmingEmail] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Handle email confirmation on component mount
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Check for confirmation tokens in URL params or hash
      const type = params.type as string;
      const access_token = params.access_token as string;
      const refresh_token = params.refresh_token as string;
      
      // Handle URL hash fragments (common with Supabase email confirmations)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');
        const hashType = hashParams.get('type');
        
        if (hashAccessToken && hashRefreshToken && hashType === 'signup') {
          setConfirmingEmail(true);
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken
            });
            
            if (error) {
              console.error('Email confirmation error:', error);
              Alert.alert(
                'Confirmation Failed',
                'There was an error confirming your email. Please try signing up again.',
                [{ text: 'OK' }]
              );
            } else {
              console.log('Email confirmed successfully:', data);
              Alert.alert(
                'Email Confirmed!',
                'Your email has been confirmed successfully. Welcome to DiaRemit!',
                [{ text: 'OK', onPress: () => {
                  router.replace('/(tabs)/home');
                }}]
              );
            }
          } catch (error) {
            console.error('Email confirmation exception:', error);
            Alert.alert(
              'Confirmation Failed',
              'An unexpected error occurred during email confirmation.',
              [{ text: 'OK' }]
            );
          } finally {
            setConfirmingEmail(false);
          }
          return;
        }
      }
      
      // Handle query parameters (fallback)
      if (access_token && refresh_token && type === 'signup') {
        setConfirmingEmail(true);
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (error) {
            console.error('Email confirmation error:', error);
            Alert.alert(
              'Confirmation Failed',
              'There was an error confirming your email. Please try signing up again.',
              [{ text: 'OK' }]
            );
          } else {
            console.log('Email confirmed successfully:', data);
            Alert.alert(
              'Email Confirmed!',
              'Your email has been confirmed successfully. Welcome to DiaRemit!',
              [{ text: 'OK', onPress: () => {
                router.replace('/(tabs)/home');
              }}]
            );
          }
        } catch (error) {
          console.error('Email confirmation exception:', error);
          Alert.alert(
            'Confirmation Failed',
            'An unexpected error occurred during email confirmation.',
            [{ text: 'OK' }]
          );
        } finally {
          setConfirmingEmail(false);
        }
      }
    };

    handleEmailConfirmation();
  }, [params, router]);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isLogin && !fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);
    
    try {
      let result;
      if (isLogin) {
        result = await signIn(email.trim(), password);
      } else {
        result = await signUp(email.trim(), password, fullName.trim(), phone.trim(), country.trim());
      }

      if (result.error) {
        let errorMessage = result.error.message || 'Authentication failed';
        
        // Handle specific error cases
        if (result.error.code === 'SUPABASE_NOT_CONFIGURED') {
          errorMessage = 'The app is not properly configured. Please contact support or try again later.';
        } else if (result.error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (result.error.message?.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (result.error.message?.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        }
        
        Alert.alert('Error', errorMessage);
      } else {
        if (!isLogin) {
          Alert.alert(
            'Success', 
            'Account created successfully! Please check your email to verify your account.',
            [{ text: 'OK', onPress: () => setIsLogin(true) }]
          );
        } else {
          // Successful login - redirect to home
          console.log('Login successful, redirecting to home');
          router.replace('/(tabs)/home');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setCountry('');
  };

  // Show loading screen during email confirmation
  if (confirmingEmail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Confirming your email...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>DiaRemit</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </Text>
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputContainer}>
                <User size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  testID="fullName-input"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Mail size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                testID="email-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                testID="password-input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                testID="toggle-password"
              >
                {showPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <>
                <View style={styles.inputContainer}>
                  <Phone size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number (Optional)"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    testID="phone-input"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Globe size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Country (Optional)"
                    value={country}
                    onChangeText={setCountry}
                    autoCapitalize="words"
                    testID="country-input"
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.authButton, loading && styles.authButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              testID="auth-button"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.authButtonText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={toggleAuthMode}
              disabled={loading}
              testID="switch-auth-mode"
            >
              <Text style={styles.switchButtonText}>
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#1a1a1a',
  },
  eyeIcon: {
    padding: 4,
  },
  authButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});