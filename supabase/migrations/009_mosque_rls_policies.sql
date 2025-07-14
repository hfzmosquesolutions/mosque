-- RLS policies for mosques table
-- Allows mosque admins to manage their own mosque profile and public read access

-- Enable RLS on mosques table
ALTER TABLE public.mosques ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view all mosques" ON public.mosques;
DROP POLICY IF EXISTS "Mosque admins can view their own mosque" ON public.mosques;
DROP POLICY IF EXISTS "Mosque admins can insert their own mosque" ON public.mosques;
DROP POLICY IF EXISTS "Mosque admins can update their own mosque" ON public.mosques;
DROP POLICY IF EXISTS "Mosque admins can delete their own mosque" ON public.mosques;
DROP POLICY IF EXISTS "Super admins can view all mosques" ON public.mosques;
DROP POLICY IF EXISTS "Super admins can insert mosques" ON public.mosques;
DROP POLICY IF EXISTS "Super admins can update all mosques" ON public.mosques;
DROP POLICY IF EXISTS "Super admins can delete all mosques" ON public.mosques;

-- Create function to check if user is admin (safe to run if it already exists)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id 
        AND role IN ('mosque_admin', 'super_admin', 'ajk')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id 
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public read access - anyone can view all mosques (for public mosque listings)
CREATE POLICY "Public can view all mosques" ON public.mosques
    FOR SELECT USING (true);

-- Mosque admins can view their own mosque (linked by profile_id)
CREATE POLICY "Mosque admins can view their own mosque" ON public.mosques
    FOR SELECT USING (auth.uid() = profile_id);

-- Mosque admins can insert their own mosque (one mosque per admin)
CREATE POLICY "Mosque admins can insert their own mosque" ON public.mosques
    FOR INSERT WITH CHECK (
        auth.uid() = profile_id 
        AND public.is_admin(auth.uid())
        AND NOT EXISTS (
            SELECT 1 FROM public.mosques 
            WHERE profile_id = auth.uid()
        )
    );

-- Mosque admins can update their own mosque
CREATE POLICY "Mosque admins can update their own mosque" ON public.mosques
    FOR UPDATE USING (
        auth.uid() = profile_id 
        AND public.is_admin(auth.uid())
    );

-- Mosque admins can delete their own mosque
CREATE POLICY "Mosque admins can delete their own mosque" ON public.mosques
    FOR DELETE USING (
        auth.uid() = profile_id 
        AND public.is_admin(auth.uid())
    );

-- Super admins can view all mosques
CREATE POLICY "Super admins can view all mosques" ON public.mosques
    FOR SELECT USING (public.is_super_admin(auth.uid()));

-- Super admins can insert any mosque
CREATE POLICY "Super admins can insert mosques" ON public.mosques
    FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));

-- Super admins can update all mosques
CREATE POLICY "Super admins can update all mosques" ON public.mosques
    FOR UPDATE USING (public.is_super_admin(auth.uid()));

-- Super admins can delete all mosques
CREATE POLICY "Super admins can delete all mosques" ON public.mosques
    FOR DELETE USING (public.is_super_admin(auth.uid()));
