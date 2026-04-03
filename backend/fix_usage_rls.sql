-- Execute this script in the Supabase SQL Editor to fix usage tracking permissions

-- 1. Create the table if it's completely missing
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    actions_count INTEGER DEFAULT 0,
    last_reset TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure RLS is active
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- 3. Clear any broken policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can update own usage" ON public.usage_tracking;

-- 4. Create fresh, correct policies
CREATE POLICY "Users can view own usage" 
ON public.usage_tracking FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" 
ON public.usage_tracking FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" 
ON public.usage_tracking FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- 5. Final check of table permissions
GRANT ALL ON public.usage_tracking TO authenticated;
GRANT ALL ON public.usage_tracking TO service_role;
