-- Create kariah applications table
CREATE TABLE public.kariah_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    mosque_id uuid NOT NULL,
    ic_passport_number varchar(20) NOT NULL,
    application_reason text,
    supporting_documents jsonb DEFAULT '[]'::jsonb,
    status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_notes text,
    matched_legacy_records_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kariah_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id),
    CONSTRAINT kariah_applications_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES public.mosques(id),
    CONSTRAINT kariah_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.user_profiles(id),
    UNIQUE(user_id, mosque_id)
);

-- Create indexes for performance
CREATE INDEX idx_kariah_applications_status ON public.kariah_applications(status);
CREATE INDEX idx_kariah_applications_mosque ON public.kariah_applications(mosque_id);
CREATE INDEX idx_kariah_applications_ic_passport ON public.kariah_applications(ic_passport_number);
CREATE INDEX idx_kariah_applications_user ON public.kariah_applications(user_id);
CREATE INDEX idx_kariah_applications_created_at ON public.kariah_applications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.kariah_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own applications
CREATE POLICY "Users can view own applications" ON public.kariah_applications
    FOR SELECT USING (user_id = auth.uid());

-- RLS Policy: Users can create their own applications
CREATE POLICY "Users can create own applications" ON public.kariah_applications
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can update their own pending applications
CREATE POLICY "Users can update own pending applications" ON public.kariah_applications
    FOR UPDATE USING (user_id = auth.uid() AND status = 'pending')
    WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- RLS Policy: Mosque admins can manage applications for their mosque
CREATE POLICY "Mosque admins can manage applications" ON public.kariah_applications
    FOR ALL USING (
        mosque_id IN (
            SELECT m.id FROM public.mosques m 
            WHERE m.user_id = auth.uid()
        )
    );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.kariah_applications TO authenticated;
GRANT SELECT ON public.kariah_applications TO anon;

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_kariah_applications_updated_at
    BEFORE UPDATE ON public.kariah_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to notify admins of new applications
CREATE OR REPLACE FUNCTION notify_admin_new_application()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notification for mosque admin
    INSERT INTO public.notifications (
        user_id,
        mosque_id,
        title,
        message,
        type,
        created_at
    )
    SELECT 
        m.user_id,
        NEW.mosque_id,
        'New Kariah Application',
        'A new kariah membership application has been submitted by ' || up.full_name,
        'application',
        now()
    FROM public.mosques m
    JOIN public.user_profiles up ON up.id = NEW.user_id
    WHERE m.id = NEW.mosque_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to notify admins of new applications
CREATE TRIGGER notify_admin_new_application_trigger
    AFTER INSERT ON public.kariah_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_application();