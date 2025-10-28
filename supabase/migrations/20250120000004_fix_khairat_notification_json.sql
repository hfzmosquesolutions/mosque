-- Fix khairat notification trigger JSON syntax
-- This migration updates the existing notification function to use proper JSON construction

-- Drop and recreate the function with correct JSON syntax
CREATE OR REPLACE FUNCTION notify_admin_new_khairat_application()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notification for mosque admin
    INSERT INTO public.notifications (
        user_id,
        mosque_id,
        title,
        message,
        type,
        metadata,
        created_at
    )
    SELECT 
        m.user_id,
        NEW.mosque_id,
        'New Khairat Application',
        'A new khairat membership application has been submitted by ' || up.full_name,
        'application',
        json_build_object('type', 'khairat', 'application_id', NEW.id)::jsonb,
        now()
    FROM public.mosques m
    JOIN public.user_profiles up ON up.id = NEW.user_id
    WHERE m.id = NEW.mosque_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
