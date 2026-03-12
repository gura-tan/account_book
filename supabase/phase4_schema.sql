-- ============================================
-- Account Book App — Phase 4 Schema Updates
-- ============================================

-- 1. Updates to portfolio_settings and monthly_budgets
-- Add group_id to link portfolio and budgets to the shared family group
ALTER TABLE portfolio_settings ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE monthly_budgets ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- 2. Update Group Members RLS to allow inserting into group_members
-- Drop the old policy if it exists to replace it
DROP POLICY IF EXISTS "Users can view own group memberships" ON group_members;
CREATE POLICY "Users can view own group memberships" ON group_members FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert group memberships"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Groups RLS Updates
-- Allow creating new groups
CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (true);

-- 4. Shared Data RLS Updates (Transactions, Assets, Budgets)
-- Ensure users can read/write data in groups they belong to

-- Transactions: Can see own personal book OR any shared book belonging to their group
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view transactions" ON transactions FOR SELECT
  USING (
    (user_id = auth.uid() AND book_type = 'personal') OR
    (book_type = 'shared' AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert transactions" ON transactions FOR INSERT
  WITH CHECK (
    (user_id = auth.uid() AND book_type = 'personal') OR
    (book_type = 'shared' AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update transactions" ON transactions FOR UPDATE
  USING (
    (user_id = auth.uid() AND book_type = 'personal') OR
    (book_type = 'shared' AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can delete transactions" ON transactions FOR DELETE
  USING (
    (user_id = auth.uid() AND book_type = 'personal') OR
    (book_type = 'shared' AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

-- Assets: Can see own assets OR assets belonging to their group
DROP POLICY IF EXISTS "Users can view own assets" ON assets;
CREATE POLICY "Users can view assets" ON assets FOR SELECT
  USING (
    user_id = auth.uid() OR 
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert own assets" ON assets;
CREATE POLICY "Users can insert assets" ON assets FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR 
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own assets" ON assets;
CREATE POLICY "Users can update assets" ON assets FOR UPDATE
  USING (
    user_id = auth.uid() OR 
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own assets" ON assets;
CREATE POLICY "Users can delete assets" ON assets FOR DELETE
  USING (
    user_id = auth.uid() OR 
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

-- Monthly Budgets RLS
DROP POLICY IF EXISTS "Users can manage own budgets" ON monthly_budgets;
CREATE POLICY "Users can view budgets" ON monthly_budgets FOR SELECT
  USING (
    user_id = auth.uid() OR 
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can insert budgets" ON monthly_budgets FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR 
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can update budgets" ON monthly_budgets FOR UPDATE
  USING (
    user_id = auth.uid() OR 
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

-- Portfolio Settings RLS
DROP POLICY IF EXISTS "Users can manage own portfolio settings" ON portfolio_settings;
CREATE POLICY "Users can view portfolio settings" ON portfolio_settings FOR SELECT
  USING (
    user_id = auth.uid() OR 
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can insert portfolio settings" ON portfolio_settings FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR 
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can update portfolio settings" ON portfolio_settings FOR UPDATE
  USING (
    user_id = auth.uid() OR 
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can delete portfolio settings" ON portfolio_settings FOR DELETE
  USING (
    user_id = auth.uid() OR 
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

-- 5. Auto-Group Trigger
-- When a user is created, also create a default group for them so they have a 'Shared Book' from day 1
CREATE OR REPLACE FUNCTION public.handle_new_user_group()
RETURNS TRIGGER AS $$
DECLARE
  new_group_id UUID;
BEGIN
  -- 1. Create Profile (handled by original trigger, but let's ensure it exists or does not conflict)
  -- The original handle_new_user trigger in Phase 1 already creates the profile.
  -- 2. Create Default Group
  INSERT INTO public.groups (name) VALUES (COALESCE(NEW.raw_user_meta_data->>'display_name', 'My Family') || ' Family') RETURNING id INTO new_group_id;
  -- 3. Add User to Group
  INSERT INTO public.group_members (group_id, user_id, role) VALUES (new_group_id, NEW.id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to handle both profile mapping and group mapping at once
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user_full()
RETURNS TRIGGER AS $$
DECLARE
  new_group_id UUID;
BEGIN
  -- 1. Create Profile
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  
  -- 2. Create Default Group
  INSERT INTO public.groups (name) VALUES (COALESCE(NEW.raw_user_meta_data->>'display_name', '自分') || 'の家庭') RETURNING id INTO new_group_id;
  
  -- 3. Add User to Group
  INSERT INTO public.group_members (group_id, user_id, role) VALUES (new_group_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_full();
