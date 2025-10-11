import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { supabase, isSupabaseConfigured, Database } from '@/lib/supabase';
import { useAuth } from './AuthProvider';

type Balance = Database['public']['Tables']['balances']['Row'];
type BalanceTransaction = Database['public']['Tables']['balance_transactions']['Row'];

interface BalanceContextType {
  balances: Balance[];
  transactions: BalanceTransaction[];
  loading: boolean;
  refreshing: boolean;
  getBalance: (currency: string) => number;
  refreshBalances: () => Promise<void>;
  loadTransactions: () => Promise<void>;
}

export const [BalanceProvider, useBalance] = createContextHook<BalanceContextType>(() => {
  const { user, session } = useAuth();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadBalances = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      console.log('No user or Supabase not configured, skipping balance load');
      setLoading(false);
      return;
    }

    try {
      console.log('Loading balances for user:', user.id);
      
      const { data, error } = await supabase
        .from('balances')
        .select('*')
        .eq('user_id', user.id)
        .order('currency', { ascending: true });

      if (error) {
        console.error('Error loading balances:', error);
        return;
      }

      if (data) {
        console.log('Balances loaded:', data);
        setBalances(data);
      }
    } catch (error) {
      console.error('Exception loading balances:', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadTransactions = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      console.log('No user or Supabase not configured, skipping transactions load');
      return;
    }

    try {
      console.log('Loading balance transactions for user:', user.id);
      
      const { data, error } = await supabase
        .from('balance_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading transactions:', error);
        return;
      }

      if (data) {
        console.log('Transactions loaded:', data.length);
        setTransactions(data);
      }
    } catch (error) {
      console.error('Exception loading transactions:', error instanceof Error ? error.message : String(error));
    }
  }, [user]);

  const refreshBalances = useCallback(async () => {
    setRefreshing(true);
    await loadBalances();
    await loadTransactions();
    setRefreshing(false);
  }, [loadBalances, loadTransactions]);

  const getBalance = useCallback((currency: string): number => {
    const balance = balances.find(b => b.currency === currency);
    return balance?.amount || 0;
  }, [balances]);

  useEffect(() => {
    if (session && user) {
      loadBalances();
      loadTransactions();
    } else {
      setBalances([]);
      setTransactions([]);
      setLoading(false);
    }
  }, [session, user, loadBalances, loadTransactions]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    const channel = supabase
      .channel('balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'balances',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log('Balance changed:', payload);
          loadBalances();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'balance_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log('New transaction:', payload);
          loadTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadBalances, loadTransactions]);

  return useMemo(() => ({
    balances,
    transactions,
    loading,
    refreshing,
    getBalance,
    refreshBalances,
    loadTransactions,
  }), [balances, transactions, loading, refreshing, getBalance, refreshBalances, loadTransactions]);
});
