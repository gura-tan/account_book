-- ============================================
-- Account Book App — Phase 2 Schema additions
-- ============================================
-- Run this in Supabase SQL Editor AFTER schema.sql

-- 1. Monthly expected budgets
CREATE TABLE IF NOT EXISTS monthly_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- Format: 'yyyy-mm'
  expected_income BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, year_month)
);

ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own monthly budgets"
  ON monthly_budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly budgets"
  ON monthly_budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly budgets"
  ON monthly_budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly budgets"
  ON monthly_budgets FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Portfolio template settings
-- This stores the user's priority-based allocation rules
CREATE TABLE IF NOT EXISTS portfolio_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0, -- Lower number = higher priority
  calc_type TEXT NOT NULL CHECK (calc_type IN ('sum', 'ratio')),
  calc_value NUMERIC NOT NULL,       -- Fixed amount for 'sum', percentage (0.00-1.00) for 'ratio'
  min_amount BIGINT,                 -- Optional min cap for ratio
  max_amount BIGINT,                 -- Optional max cap for ratio
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

ALTER TABLE portfolio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolio settings"
  ON portfolio_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio settings"
  ON portfolio_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio settings"
  ON portfolio_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio settings"
  ON portfolio_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Function to initialize default portfolio settings for a new user
-- You can run this manually for existing users, or let the client handle it if the table is empty.
CREATE OR REPLACE FUNCTION public.init_default_portfolio(target_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.portfolio_settings (user_id, category, sort_order, calc_type, calc_value, min_amount, max_amount)
  VALUES
    (target_user_id, '固定費', 1, 'ratio', 0.20, NULL, NULL),
    (target_user_id, '投資',   2, 'ratio', 0.10, NULL, NULL),
    (target_user_id, '消費',   3, 'ratio', 0.40, 50000, NULL),
    (target_user_id, '貯金',   4, 'ratio', 0.15, NULL, NULL),
    (target_user_id, 'パーソナル', 5, 'ratio', 0.15, NULL, NULL)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
