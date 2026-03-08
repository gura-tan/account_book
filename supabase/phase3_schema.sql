-- ============================================
-- Account Book App — Phase 3.1 Schema additions
-- ============================================

-- Add 'is_deducted' flag to portfolio settings for the automatic income deduction feature
ALTER TABLE portfolio_settings ADD COLUMN IF NOT EXISTS is_deducted BOOLEAN NOT NULL DEFAULT false;

-- Update the default portfolio initialization function to include is_deducted
CREATE OR REPLACE FUNCTION public.init_default_portfolio(target_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.portfolio_settings (user_id, category, sort_order, calc_type, calc_value, min_amount, max_amount, is_deducted)
  VALUES
    (target_user_id, '固定費', 1, 'ratio', 0.20, NULL, NULL, true),
    (target_user_id, '投資',   2, 'ratio', 0.10, NULL, NULL, true),
    (target_user_id, '消費',   3, 'ratio', 0.40, 50000, NULL, false),
    (target_user_id, '貯金',   4, 'ratio', 0.15, NULL, NULL, true),
    (target_user_id, 'パーソナル', 5, 'ratio', 0.15, NULL, NULL, false)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
