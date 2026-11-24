-- ========================================================
-- VaultFinance Supabase Schema Migration Script
-- Run this in your Supabase Project's SQL Editor
-- (Dashboard -> SQL Editor -> New Query -> Paste & Run)
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & USER SETTINGS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  primary_currency TEXT DEFAULT 'USD',
  theme TEXT DEFAULT 'system',
  privacy_blur_enabled BOOLEAN DEFAULT FALSE,
  budget_view_mode TEXT DEFAULT 'hybrid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. FINANCIAL ACCOUNTS (Bank, Credit Card, Investment, Cash, Loan)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'loan', 'cash', 'other')),
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  institution TEXT,
  account_number_mask TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(14, 2) NOT NULL, -- Negative for expenses, positive for income
  payee TEXT NOT NULL,
  category TEXT NOT NULL,
  macro_bucket TEXT DEFAULT 'wants' CHECK (macro_bucket IN ('needs', 'wants', 'savings', 'income')),
  notes TEXT,
  currency TEXT DEFAULT 'USD',
  is_recurring BOOLEAN DEFAULT FALSE,
  is_excluded_from_budget BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. MONTHLY BUDGETS
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  macro_bucket TEXT DEFAULT 'wants' CHECK (macro_bucket IN ('needs', 'wants', 'savings')),
  monthly_limit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  period TEXT DEFAULT 'monthly',
  alert_threshold_percent INTEGER DEFAULT 85,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. SAVINGS GOALS
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  target_amount NUMERIC(14, 2) NOT NULL,
  current_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  target_date DATE,
  icon TEXT DEFAULT 'target',
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. DEBTS (For Snowball & Avalanche Payoff Simulator)
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'student_loan', 'auto_loan', 'mortgage', 'personal_loan', 'medical', 'other')),
  balance NUMERIC(14, 2) NOT NULL,
  interest_rate NUMERIC(6, 3) NOT NULL, -- Annual Percentage Rate (APR e.g. 18.99%)
  minimum_payment NUMERIC(14, 2) NOT NULL,
  due_day_of_month INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Standard User Isolation Policies
CREATE POLICY "Users can manage their own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own accounts" ON public.accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own debts" ON public.debts
  FOR ALL USING (auth.uid() = user_id);

-- Profile creation trigger on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
