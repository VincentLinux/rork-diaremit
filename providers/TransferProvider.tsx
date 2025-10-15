import { useState, useEffect, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthProvider';

interface Recipient {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  email?: string;
  country: string;
  flag: string;
  bank?: string;
  account_number?: string;
}

interface Transfer {
  id: string;
  sender_id?: string;
  recipient_id?: string;
  recipient_name: string;
  amount: number;
  fee: number;
  source_currency?: string;
  target_currency?: string;
  exchange_rate?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  date: string;
  country: string;
  type: 'sent' | 'received';
  payment_method?: string;
  transfer_time?: string;
  institution_name?: string;
  institution_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface ExchangeRate {
  country: string;
  flag: string;
  currency: string;
  rate: number;
  source?: string;
  confidence?: number;
  lastUpdated?: string;
}

interface InstitutionRate {
  id: string;
  name: string;
  logo?: string;
  rate: number;
  fee: number;
  transferTime: string;
  rating: number;
  features: string[];
  lastUpdated: string;
}

interface LiveRateComparison {
  country: string;
  flag: string;
  currency: string;
  institutions: InstitutionRate[];
  bestRateInstitution: string;
  averageRate: number;
}

interface AIRateAnalysis {
  bestRate: ExchangeRate;
  alternatives: ExchangeRate[];
  marketTrend: 'up' | 'down' | 'stable';
  recommendation: string;
  confidence: number;
  sources: string[];
}

interface ScheduledTransfer {
  id: string;
  recipientId: string;
  amount: number;
  sourceCurrency: string;
  targetCurrency: string;
  selectedRate: ExchangeRate;
  scheduledDate: string;
  status: 'scheduled' | 'executed' | 'cancelled';
  aiAnalysis?: AIRateAnalysis;
}

export const [TransferProvider, useTransfer] = createContextHook(() => {
  const { user, session } = useAuth();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<Transfer[]>([]);
  const [preferredPaymentMethod, setPreferredPaymentMethodState] = useState<string>('mobile_wallet');
  const [scheduledTransfers, setScheduledTransfers] = useState<ScheduledTransfer[]>([]);
  const [aiRateAnalysis, setAIRateAnalysis] = useState<AIRateAnalysis | null>(null);
  const [isAnalyzingRates, setIsAnalyzingRates] = useState<boolean>(false);
  const [selectedInstitutions, setSelectedInstitutions] = useState<Record<string, string>>({});
  const [isRefreshingRates, setIsRefreshingRates] = useState<boolean>(false);

  const [exchangeRates] = useState<ExchangeRate[]>([
    { country: "Ghana", flag: "🇬🇭", currency: "GHS", rate: 12.5, source: "Manual", confidence: 0.8, lastUpdated: new Date().toISOString() },
    { country: "Kenya", flag: "🇰🇪", currency: "KES", rate: 153.2, source: "Manual", confidence: 0.8, lastUpdated: new Date().toISOString() },
    { country: "Senegal", flag: "🇸🇳", currency: "XOF", rate: 615.8, source: "Manual", confidence: 0.8, lastUpdated: new Date().toISOString() },
    { country: "Uganda", flag: "🇺🇬", currency: "UGX", rate: 3750.5, source: "Manual", confidence: 0.8, lastUpdated: new Date().toISOString() },
  ]);

  const [liveRates] = useState<LiveRateComparison[]>([
    {
      country: "Ghana",
      flag: "🇬🇭",
      currency: "GHS",
      bestRateInstitution: "institution_a",
      averageRate: 12.45,
      institutions: [
        {
          id: "institution_a",
          name: "SwiftTransfer Pro",
          rate: 12.65,
          fee: 2.99,
          transferTime: "1-2 hours",
          rating: 4.8,
          features: ["Instant notifications", "24/7 support", "Mobile wallet"],
          lastUpdated: new Date().toISOString()
        },
        {
          id: "institution_b",
          name: "GlobalSend Express",
          rate: 12.25,
          fee: 4.99,
          transferTime: "2-4 hours",
          rating: 4.5,
          features: ["Bank transfer", "Cash pickup", "Online tracking"],
          lastUpdated: new Date().toISOString()
        }
      ]
    }
  ]);

  const saveData = useCallback(async (key: string, data: any) => {
    if (!key?.trim() || data === undefined || data === null) return;
    try {
      await AsyncStorage.setItem(key.trim(), JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error instanceof Error ? error.message : String(error));
    }
  }, []);

  const loadSupabaseData = useCallback(async () => {
    if (!user) {
      console.log('No user available, skipping Supabase data load');
      return;
    }
    
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured, skipping data load');
      return;
    }
    
    try {
      console.log('Loading data from Supabase for user:', user.id);
      
      // Load recipients
      try {
        const { data: recipientsData, error: recipientsError } = await supabase
          .from('recipients')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (recipientsError) {
          console.error('Error loading recipients:', {
            message: recipientsError.message,
            code: recipientsError.code,
            details: recipientsError.details,
            hint: recipientsError.hint,
            fullError: recipientsError
          });
        } else if (recipientsData) {
          const formattedRecipients = recipientsData.map((r: any) => ({
            id: r.id,
            user_id: r.user_id,
            name: r.name,
            phone: r.phone || '',
            email: r.email || undefined,
            country: r.country,
            flag: r.flag || '',
            bank: r.bank || undefined,
            account_number: r.account_number || undefined,
          }));
          setRecipients(formattedRecipients);
        }
      } catch (error) {
        console.error('Error loading recipients:', error instanceof Error ? error.message : String(error));
      }
      
      // Load transfers
      try {
        const { data: transfersData, error: transfersError } = await supabase
          .from('transfers')
          .select('*')
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (transfersError) {
          console.error('Error loading transfers:', {
            message: transfersError.message,
            code: transfersError.code,
            details: transfersError.details,
            hint: transfersError.hint,
            fullError: transfersError
          });
        } else if (transfersData) {
          const formattedTransfers = transfersData.map((t: any) => ({
            id: t.id,
            sender_id: t.sender_id,
            recipient_id: t.recipient_id,
            recipient_name: t.recipient_name,
            amount: t.amount,
            fee: t.fee,
            source_currency: t.source_currency,
            target_currency: t.target_currency,
            exchange_rate: t.exchange_rate,
            status: t.status,
            date: new Date(t.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            }),
            country: t.target_currency === 'GHS' ? 'Ghana' : 
                     t.target_currency === 'KES' ? 'Kenya' : 
                     t.target_currency === 'XOF' ? 'Senegal' : 
                     t.target_currency === 'UGX' ? 'Uganda' : 'Unknown',
            type: 'sent' as const,
            payment_method: t.payment_method,
            transfer_time: t.transfer_time,
            institution_name: t.institution_name,
            institution_id: t.institution_id,
            created_at: t.created_at,
            updated_at: t.updated_at,
          }));
          setRecentTransfers(formattedTransfers);
        }
      } catch (error) {
        console.error('Error loading transfers:', error instanceof Error ? error.message : String(error));
      }
    } catch (error) {
      console.error('Error loading Supabase data:', error instanceof Error ? error.message : String(error));
    }
  }, [user]);

  const loadLocalData = useCallback(async () => {
    try {
      const storedPaymentMethod = await AsyncStorage.getItem('preferredPaymentMethod');
      if (storedPaymentMethod) {
        setPreferredPaymentMethodState(storedPaymentMethod);
      }
    } catch (error) {
      console.error('Error loading local data:', error instanceof Error ? error.message : String(error));
    }
  }, []);

  useEffect(() => {
    if (session && user) {
      loadSupabaseData();
    } else {
      loadLocalData();
    }
  }, [session, user]);

  const addRecipient = useCallback(async (recipient: Omit<Recipient, 'id' | 'user_id'>) => {
    if (!user) {
      return { error: 'No user logged in' };
    }
    
    if (!isSupabaseConfigured) {
      return { error: 'Database not configured' };
    }
    
    if (!recipient.email) {
      return { error: 'Email is required' };
    }
    
    try {
      const { data, error } = await supabase
        .from('recipients')
        .insert([
          {
            user_id: user.id,
            name: recipient.name,
            phone: recipient.phone,
            email: recipient.email,
            country: recipient.country,
            flag: recipient.flag,
            bank: recipient.bank || null,
            account_number: recipient.account_number || null,
          },
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding recipient:', error);
        return { error: error.message };
      }
      
      const formattedRecipient: Recipient = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        phone: data.phone || '',
        email: data.email || undefined,
        country: data.country,
        flag: data.flag || '',
        bank: data.bank || undefined,
        account_number: data.account_number || undefined,
      };
      
      setRecipients(prev => [formattedRecipient, ...prev]);
      return { error: null, data: formattedRecipient };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add recipient';
      console.error('Exception adding recipient:', errorMessage);
      return { error: errorMessage };
    }
  }, [user]);

  const deleteRecipient = useCallback(async (recipientId: string) => {
    console.log('deleteRecipient called with:', { recipientId, userId: user?.id, isSupabaseConfigured });
    
    if (!user) {
      console.error('Delete failed: No user logged in');
      return { error: 'No user logged in' };
    }
    
    if (!isSupabaseConfigured) {
      console.error('Delete failed: Database not configured');
      return { error: 'Database not configured' };
    }
    
    try {
      console.log('Attempting to delete recipient from database...');
      const { error } = await supabase
        .from('recipients')
        .delete()
        .eq('id', recipientId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error deleting recipient from database:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return { error: error.message };
      }
      
      console.log('Recipient deleted successfully from database, updating local state');
      setRecipients(prev => prev.filter(r => r.id !== recipientId));
      console.log('Local state updated successfully');
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete recipient';
      console.error('Exception deleting recipient:', errorMessage, error);
      return { error: errorMessage };
    }
  }, [user]);

  const updateRecipient = useCallback(async (recipientId: string, updates: Partial<Omit<Recipient, 'id' | 'user_id'>>) => {
    if (!user) {
      return { error: 'No user logged in' };
    }
    
    if (!isSupabaseConfigured) {
      return { error: 'Database not configured' };
    }
    
    if (updates.email !== undefined && !updates.email) {
      return { error: 'Email is required' };
    }
    
    try {
      const { data, error } = await supabase
        .from('recipients')
        .update({
          name: updates.name,
          phone: updates.phone,
          email: updates.email,
          country: updates.country,
          flag: updates.flag,
          bank: updates.bank || null,
          account_number: updates.account_number || null,
        })
        .eq('id', recipientId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating recipient:', error);
        return { error: error.message };
      }
      
      const formattedRecipient: Recipient = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        phone: data.phone || '',
        email: data.email || undefined,
        country: data.country,
        flag: data.flag || '',
        bank: data.bank || undefined,
        account_number: data.account_number || undefined,
      };
      
      setRecipients(prev => prev.map(r => r.id === recipientId ? formattedRecipient : r));
      return { error: null, data: formattedRecipient };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update recipient';
      console.error('Exception updating recipient:', errorMessage);
      return { error: errorMessage };
    }
  }, [user]);

  const updateTransferStatus = useCallback(async (transferId: string, status: Transfer['status']) => {
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured, skipping transfer status update');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('transfers')
        .update({ status })
        .eq('id', transferId);
      
      if (error) {
        console.error('Error updating transfer status:', error);
        return;
      }
      
      setRecentTransfers(prev => 
        prev.map(t => t.id === transferId ? { ...t, status } : t)
      );
    } catch (error) {
      console.error('Exception updating transfer status:', error instanceof Error ? error.message : String(error));
    }
  }, []);

  const addTransfer = useCallback(async (transfer: {
    id?: string;
    recipient_id?: string;
    recipient_user_id?: string;
    recipient_name: string;
    amount: string | number;
    fee?: string | number;
    source_currency?: string;
    target_currency?: string;
    exchange_rate?: number;
    status?: string;
    date?: string;
    country?: string;
    type?: string;
    payment_method?: string;
    transfer_time?: string;
    institution_name?: string;
    institution_id?: string;
  }) => {
    if (!user) {
      return { error: 'No user logged in' };
    }
    
    if (!isSupabaseConfigured) {
      return { error: 'Database not configured' };
    }
    
    try {
      const amount = typeof transfer.amount === 'string' ? parseFloat(transfer.amount) : transfer.amount;
      const fee = typeof transfer.fee === 'string' ? parseFloat(transfer.fee) : (transfer.fee || 0);
      
      console.log('Calling process_transfer with params:', {
        p_sender_id: user.id,
        p_recipient_user_id: transfer.recipient_user_id || null,
        p_recipient_id: transfer.recipient_id || '',
        p_recipient_name: transfer.recipient_name,
        p_amount: amount,
        p_fee: fee,
        p_source_currency: transfer.source_currency || 'USD',
        p_target_currency: transfer.target_currency || 'USD',
      });
      
      const { data, error } = await supabase.rpc('process_transfer', {
        p_sender_id: user.id,
        p_recipient_user_id: transfer.recipient_user_id || null,
        p_recipient_id: transfer.recipient_id || '',
        p_recipient_name: transfer.recipient_name,
        p_amount: amount,
        p_fee: fee,
        p_source_currency: transfer.source_currency || 'USD',
        p_target_currency: transfer.target_currency || 'USD',
        p_exchange_rate: transfer.exchange_rate || 1,
        p_payment_method: transfer.payment_method || null,
        p_transfer_time: transfer.transfer_time || null,
        p_institution_name: transfer.institution_name || null,
        p_institution_id: transfer.institution_id || null,
      });
      
      console.log('process_transfer result:', { data, error });
      
      if (error) {
        console.error('Error processing transfer:', error);
        return { error: error.message };
      }
      
      if (!data || data.length === 0) {
        return { error: 'Transfer failed' };
      }
      
      const result = data[0];
      
      if (!result.success) {
        return { error: result.error_message || 'Transfer failed' };
      }
      
      const { data: transferData, error: fetchError } = await supabase
        .from('transfers')
        .select('*')
        .eq('id', result.transfer_id)
        .single();
      
      if (fetchError || !transferData) {
        console.error('Error fetching transfer:', fetchError);
        return { error: 'Transfer created but failed to fetch details' };
      }
      
      const formattedTransfer: Transfer = {
        id: transferData.id,
        sender_id: transferData.sender_id,
        recipient_id: transferData.recipient_id,
        recipient_name: transferData.recipient_name,
        amount: transferData.amount,
        fee: transferData.fee,
        source_currency: transferData.source_currency,
        target_currency: transferData.target_currency,
        exchange_rate: transferData.exchange_rate,
        status: transferData.status,
        date: new Date(transferData.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        country: transferData.target_currency === 'GHS' ? 'Ghana' : 
                 transferData.target_currency === 'KES' ? 'Kenya' : 
                 transferData.target_currency === 'XOF' ? 'Senegal' : 
                 transferData.target_currency === 'UGX' ? 'Uganda' : 'Unknown',
        type: 'sent',
        payment_method: transferData.payment_method,
        transfer_time: transferData.transfer_time,
        institution_name: transferData.institution_name,
        institution_id: transferData.institution_id,
        created_at: transferData.created_at,
        updated_at: transferData.updated_at,
      };
      
      setRecentTransfers(prev => [formattedTransfer, ...prev]);
      
      setTimeout(async () => {
        await updateTransferStatus(transferData.id, 'processing');
        setTimeout(async () => {
          await updateTransferStatus(transferData.id, 'completed');
        }, 3000);
      }, 2000);
      
      return { error: null, data: formattedTransfer };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create transfer';
      console.error('Exception adding transfer:', errorMessage);
      return { error: errorMessage };
    }
  }, [user, updateTransferStatus]);

  const setPreferredPaymentMethod = useCallback((method: string) => {
    if (!method?.trim()) return;
    const sanitizedMethod = method.trim();
    setPreferredPaymentMethodState(sanitizedMethod);
    saveData('preferredPaymentMethod', sanitizedMethod);
  }, [saveData]);

  const selectInstitution = useCallback((country: string, institutionId: string) => {
    const updated = { ...selectedInstitutions, [country]: institutionId };
    setSelectedInstitutions(updated);
    saveData('selectedInstitutions', updated);
  }, [selectedInstitutions, saveData]);

  const getSelectedInstitution = useCallback((country: string): InstitutionRate | null => {
    const selectedId = selectedInstitutions[country];
    if (!selectedId) return null;
    
    const countryRates = liveRates.find(r => r.country === country);
    return countryRates?.institutions.find(inst => inst.id === selectedId) || null;
  }, [selectedInstitutions, liveRates]);

  const getBestRateForCountry = useCallback((country: string): InstitutionRate | null => {
    const countryRates = liveRates.find(r => r.country === country);
    if (!countryRates) return null;
    
    return countryRates.institutions.reduce((best, current) => 
      current.rate > best.rate ? current : best
    );
  }, [liveRates]);

  const refreshLiveRates = useCallback(async () => {
    setIsRefreshingRates(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Live rates refreshed');
    } catch (error) {
      console.error('Error refreshing live rates:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsRefreshingRates(false);
    }
  }, []);

  return useMemo(() => ({
    recipients,
    recentTransfers,
    exchangeRates,
    scheduledTransfers,
    aiRateAnalysis,
    isAnalyzingRates,
    addRecipient,
    deleteRecipient,
    updateRecipient,
    addTransfer,
    preferredPaymentMethod,
    setPreferredPaymentMethod,
    liveRates,
    selectedInstitutions,
    isRefreshingRates,
    refreshLiveRates,
    selectInstitution,
    getSelectedInstitution,
    getBestRateForCountry,
    updateTransferStatus,
    loadSupabaseData,
  }), [
    recipients,
    recentTransfers,
    exchangeRates,
    scheduledTransfers,
    aiRateAnalysis,
    isAnalyzingRates,
    addRecipient,
    deleteRecipient,
    updateRecipient,
    addTransfer,
    preferredPaymentMethod,
    setPreferredPaymentMethod,
    liveRates,
    selectedInstitutions,
    isRefreshingRates,
    refreshLiveRates,
    selectInstitution,
    getSelectedInstitution,
    getBestRateForCountry,
    updateTransferStatus,
    loadSupabaseData,
  ]);
});