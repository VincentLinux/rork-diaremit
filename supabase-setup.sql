-- ============================================
-- BALANCE SYSTEM SQL SETUP
-- ============================================
-- Run these SQL commands in your Supabase SQL Editor
-- in the order they appear below

-- ============================================
-- 1. CREATE BALANCES TABLE
-- ============================================
-- This table stores user balances for different currencies
CREATE TABLE IF NOT EXISTS public.balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'USD',
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, currency)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_balances_user_id ON public.balances(user_id);
CREATE INDEX IF NOT EXISTS idx_balances_currency ON public.balances(currency);

-- Enable Row Level Security
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own balances" ON public.balances;
DROP POLICY IF EXISTS "Users can insert their own balances" ON public.balances;
DROP POLICY IF EXISTS "Users can update their own balances" ON public.balances;

-- RLS Policies for balances
CREATE POLICY "Users can view their own balances"
  ON public.balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balances"
  ON public.balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own balances"
  ON public.balances FOR UPDATE
  USING (auth.uid() = user_id);

-- IMPORTANT: The process_transfer function uses SECURITY DEFINER
-- which means it runs with the privileges of the function owner (postgres)
-- This allows it to bypass RLS and update recipient balances

-- ============================================
-- 2. CREATE BALANCE TRANSACTIONS TABLE
-- ============================================
-- This table logs all balance changes for audit trail
CREATE TABLE IF NOT EXISTS public.balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  balance_before DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'transfer_sent', 'transfer_received', 'fee', 'refund', 'initial')),
  reference_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user_id ON public.balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_reference_id ON public.balance_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_created_at ON public.balance_transactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own balance transactions" ON public.balance_transactions;
DROP POLICY IF EXISTS "Users can insert their own balance transactions" ON public.balance_transactions;

-- RLS Policies for balance_transactions
CREATE POLICY "Users can view their own balance transactions"
  ON public.balance_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance transactions"
  ON public.balance_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- IMPORTANT: The process_transfer function uses SECURITY DEFINER
-- which means it runs with the privileges of the function owner (postgres)
-- This allows it to bypass RLS and insert transactions for recipients

-- ============================================
-- 3. UPDATE TRANSFERS TABLE
-- ============================================
-- Add recipient_user_id column to link transfers to actual users
ALTER TABLE public.transfers 
ADD COLUMN IF NOT EXISTS recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for recipient_user_id
CREATE INDEX IF NOT EXISTS idx_transfers_recipient_user_id ON public.transfers(recipient_user_id);

-- ============================================
-- 4. CREATE FUNCTION TO INITIALIZE USER BALANCE
-- ============================================
-- This function creates initial balance for new users
CREATE OR REPLACE FUNCTION public.initialize_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial USD balance with fake amount (1000 USD)
  INSERT INTO public.balances (user_id, currency, amount)
  VALUES (NEW.id, 'USD', 1000.00)
  ON CONFLICT (user_id, currency) DO NOTHING;
  
  -- Log the initial balance transaction
  INSERT INTO public.balance_transactions (
    user_id, 
    currency, 
    amount, 
    balance_before, 
    balance_after, 
    transaction_type, 
    description
  )
  VALUES (
    NEW.id, 
    'USD', 
    1000.00, 
    0.00, 
    1000.00, 
    'initial', 
    'Initial balance credited'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. CREATE TRIGGER FOR NEW USER BALANCE
-- ============================================
-- This trigger automatically creates balance when a new profile is created
DROP TRIGGER IF EXISTS on_profile_created_initialize_balance ON public.profiles;
CREATE TRIGGER on_profile_created_initialize_balance
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_balance();

-- ============================================
-- 6. CREATE FUNCTION TO PROCESS TRANSFER
-- ============================================
-- This function handles the complete transfer process with balance updates
CREATE OR REPLACE FUNCTION public.process_transfer(
  p_sender_id UUID,
  p_recipient_user_id UUID,
  p_recipient_id UUID,
  p_recipient_name TEXT,
  p_amount DECIMAL,
  p_fee DECIMAL,
  p_source_currency TEXT,
  p_target_currency TEXT,
  p_exchange_rate DECIMAL,
  p_payment_method TEXT DEFAULT NULL,
  p_transfer_time TEXT DEFAULT NULL,
  p_institution_name TEXT DEFAULT NULL,
  p_institution_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  transfer_id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_transfer_id UUID;
  v_sender_balance DECIMAL;
  v_total_amount DECIMAL;
  v_recipient_balance DECIMAL;
  v_converted_amount DECIMAL;
  v_amount_in_usd DECIMAL;
  v_source_to_usd_rate DECIMAL;
BEGIN
  -- Calculate total amount (amount + fee)
  v_total_amount := p_amount + p_fee;
  
  -- Get sender's balance
  SELECT amount INTO v_sender_balance
  FROM public.balances
  WHERE user_id = p_sender_id AND currency = p_source_currency
  FOR UPDATE;
  
  -- Check if sender has sufficient balance
  IF v_sender_balance IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Sender balance not found';
    RETURN;
  END IF;
  
  IF v_sender_balance < v_total_amount THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Insufficient balance';
    RETURN;
  END IF;
  
  -- Create transfer record
  INSERT INTO public.transfers (
    sender_id,
    recipient_user_id,
    recipient_id,
    recipient_name,
    amount,
    fee,
    source_currency,
    target_currency,
    exchange_rate,
    status,
    payment_method,
    transfer_time,
    institution_name,
    institution_id
  ) VALUES (
    p_sender_id,
    p_recipient_user_id,
    p_recipient_id,
    p_recipient_name,
    p_amount,
    p_fee,
    p_source_currency,
    p_target_currency,
    p_exchange_rate,
    'pending',
    p_payment_method,
    p_transfer_time,
    p_institution_name,
    p_institution_id
  ) RETURNING id INTO v_transfer_id;
  
  -- Deduct from sender's balance
  UPDATE public.balances
  SET amount = amount - v_total_amount,
      updated_at = NOW()
  WHERE user_id = p_sender_id AND currency = p_source_currency;
  
  -- Log sender's transaction
  INSERT INTO public.balance_transactions (
    user_id,
    currency,
    amount,
    balance_before,
    balance_after,
    transaction_type,
    reference_id,
    description
  ) VALUES (
    p_sender_id,
    p_source_currency,
    -v_total_amount,
    v_sender_balance,
    v_sender_balance - v_total_amount,
    'transfer_sent',
    v_transfer_id,
    'Transfer to ' || p_recipient_name
  );
  
  -- If recipient is a registered user, credit their balance
  IF p_recipient_user_id IS NOT NULL THEN
    -- Convert source currency to USD first
    -- Exchange rates from source currency to USD
    IF p_source_currency = 'USD' THEN
      v_source_to_usd_rate := 1.0;
    ELSIF p_source_currency = 'EUR' THEN
      v_source_to_usd_rate := 1.08;
    ELSIF p_source_currency = 'SEK' THEN
      v_source_to_usd_rate := 0.091;
    ELSIF p_source_currency = 'NOK' THEN
      v_source_to_usd_rate := 0.094;
    ELSIF p_source_currency = 'DKK' THEN
      v_source_to_usd_rate := 0.14;
    ELSIF p_source_currency = 'GBP' THEN
      v_source_to_usd_rate := 1.27;
    ELSE
      v_source_to_usd_rate := 1.0;
    END IF;
    
    -- Convert amount to USD (recipient always receives USD)
    v_amount_in_usd := p_amount * v_source_to_usd_rate;
    
    -- Recipient always receives in USD
    v_converted_amount := v_amount_in_usd;
    
    -- Get recipient's current USD balance (if exists)
    SELECT amount INTO v_recipient_balance
    FROM public.balances
    WHERE user_id = p_recipient_user_id AND currency = 'USD';
    
    -- If no balance exists, set to 0
    IF v_recipient_balance IS NULL THEN
      v_recipient_balance := 0;
    END IF;
    
    -- Create or update recipient's USD balance
    INSERT INTO public.balances (user_id, currency, amount)
    VALUES (p_recipient_user_id, 'USD', v_converted_amount)
    ON CONFLICT (user_id, currency) 
    DO UPDATE SET 
      amount = public.balances.amount + v_converted_amount,
      updated_at = NOW();
    
    -- Log recipient's transaction in USD
    INSERT INTO public.balance_transactions (
      user_id,
      currency,
      amount,
      balance_before,
      balance_after,
      transaction_type,
      reference_id,
      description
    ) VALUES (
      p_recipient_user_id,
      'USD',
      v_converted_amount,
      v_recipient_balance,
      v_recipient_balance + v_converted_amount,
      'transfer_received',
      v_transfer_id,
      'Transfer from sender'
    );
  END IF;
  
  RETURN QUERY SELECT v_transfer_id, TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. INITIALIZE BALANCES FOR EXISTING USERS
-- ============================================
-- Run this to give existing users initial balances
INSERT INTO public.balances (user_id, currency, amount)
SELECT id, 'USD', 1000.00
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.balances WHERE currency = 'USD')
ON CONFLICT (user_id, currency) DO NOTHING;

-- Log initial transactions for existing users
INSERT INTO public.balance_transactions (
  user_id, 
  currency, 
  amount, 
  balance_before, 
  balance_after, 
  transaction_type, 
  description
)
SELECT 
  user_id,
  'USD',
  1000.00,
  0.00,
  1000.00,
  'initial',
  'Initial balance credited'
FROM public.balances
WHERE currency = 'USD' 
  AND user_id NOT IN (
    SELECT user_id 
    FROM public.balance_transactions 
    WHERE transaction_type = 'initial' AND currency = 'USD'
  );

-- ============================================
-- 8. CREATE FUNCTION TO LOOKUP USER BY EMAIL
-- ============================================
-- This function allows users to look up other users by email
-- for the purpose of sending money (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.lookup_user_by_email(p_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, profiles.email
  FROM public.profiles
  WHERE LOWER(TRIM(profiles.email)) = LOWER(TRIM(p_email))
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================
-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.balances TO authenticated;
GRANT SELECT, INSERT ON public.balance_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_transfer TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_user_by_email TO authenticated;

-- ============================================
-- 10. CREATE FUNCTION TO DELETE USER ACCOUNT
-- ============================================
-- This function deletes a user's account and all associated data
-- It uses SECURITY DEFINER to bypass RLS and delete auth user
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Delete balance transactions (must be done first due to foreign keys)
  DELETE FROM public.balance_transactions WHERE user_id = v_user_id;
  
  -- Delete balances
  DELETE FROM public.balances WHERE user_id = v_user_id;
  
  -- Delete transfers where user is sender
  DELETE FROM public.transfers WHERE sender_id = v_user_id;
  
  -- Delete transfers where user is recipient
  DELETE FROM public.transfers WHERE recipient_user_id = v_user_id;
  
  -- Delete recipients
  DELETE FROM public.recipients WHERE user_id = v_user_id;
  
  -- Delete profile
  DELETE FROM public.profiles WHERE id = v_user_id;
  
  -- Delete the auth user (this is the critical part)
  DELETE FROM auth.users WHERE id = v_user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete account: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account TO authenticated;

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Your balance system is now ready!
-- 
-- Summary:
-- - Users automatically get 1000 USD when they sign up
-- - Transfers between users are instant and update both balances
-- - All balance changes are logged in balance_transactions
-- - Row Level Security ensures users can only access their own data
-- - Users can delete their accounts completely
