-- ==============================================================================
-- Tallyon Supabase Database Initialization Script
-- Run this script in the Supabase Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- 1. Create Custom Enum Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_nature_type') THEN
        CREATE TYPE expense_nature_type AS ENUM ('ONE_OFF', 'RECURRING_MONTHLY', 'RECURRING_YEARLY');
    END IF;
END$$;

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL CHECK (char_length(trim(description)) > 0),
    transaction_time TIMESTAMPTZ NOT NULL,
    original_amount NUMERIC(14, 2) NOT NULL CHECK (original_amount > 0),
    original_currency VARCHAR(3) NOT NULL CHECK (original_currency IN ('CHF', 'USD', 'EUR', 'KRW')),
    category TEXT NOT NULL,
    expense_nature expense_nature_type NOT NULL DEFAULT 'ONE_OFF',
    is_fixed BOOLEAN NOT NULL DEFAULT FALSE,
    is_cash BOOLEAN NOT NULL DEFAULT FALSE,
    is_auto_generated BOOLEAN NOT NULL DEFAULT FALSE,
    parent_fixed_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    stopped_after_month VARCHAR(7) CHECK (stopped_after_month ~ '^\d{4}-\d{2}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Note for existing databases:
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_cash BOOLEAN NOT NULL DEFAULT FALSE;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_time ON public.transactions(user_id, transaction_time DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_fixed ON public.transactions(user_id, is_fixed) WHERE is_fixed = TRUE;

-- 3. Monthly Budgets Table
CREATE TABLE IF NOT EXISTS public.monthly_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year_month VARCHAR(7) NOT NULL CHECK (year_month ~ '^\d{4}-\d{2}$'),
    base_budget NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    extra_budget NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('CHF', 'USD', 'EUR', 'KRW')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_user_year_month UNIQUE (user_id, year_month)
);

-- 4. User Custom Categories Table
CREATE TABLE IF NOT EXISTS public.user_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color VARCHAR(9) NOT NULL,
    bg_color VARCHAR(9) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_user_category UNIQUE (user_id, category_id)
);

-- 5. Global Exchange Rates Cache Table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    rate_date DATE PRIMARY KEY,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
    rates JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Transactions Policies (Users can only access their own data)
DROP POLICY IF EXISTS "Users can access their own transactions" ON public.transactions;
CREATE POLICY "Users can access their own transactions" 
ON public.transactions
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Monthly Budgets Policies
DROP POLICY IF EXISTS "Users can access their own budgets" ON public.monthly_budgets;
CREATE POLICY "Users can access their own budgets" 
ON public.monthly_budgets
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- User Categories Policies
DROP POLICY IF EXISTS "Users can access their own categories" ON public.user_categories;
CREATE POLICY "Users can access their own categories" 
ON public.user_categories
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Exchange Rates Policy (Public read access, insert/update by authenticated or service role)
DROP POLICY IF EXISTS "Allow public read access to exchange rates" ON public.exchange_rates;
CREATE POLICY "Allow public read access to exchange rates" 
ON public.exchange_rates
FOR SELECT 
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to cache exchange rates" ON public.exchange_rates;
CREATE POLICY "Allow authenticated users to cache exchange rates" 
ON public.exchange_rates
FOR INSERT 
TO authenticated
WITH CHECK (true);
