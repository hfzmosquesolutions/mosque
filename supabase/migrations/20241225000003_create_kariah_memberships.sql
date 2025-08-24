-- Create kariah memberships table
CREATE TABLE public.kariah_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    mosque_id uuid NOT NULL,
    membership_number varchar(50) UNIQUE,
    status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    joined_date date DEFAULT CURRENT_DATE,
    legacy_records_count integer DEFAULT 0,
    total_legacy_amount numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kariah_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id),
    CONSTRAINT kariah_memberships_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES public.mosques(id),
    UNIQUE(user_id, mosque_id)
);

-- Create indexes for performance
CREATE INDEX idx_kariah_memberships_user ON public.kariah_memberships(user_id);
CREATE INDEX idx_kariah_memberships_mosque ON public.kariah_memberships(mosque_id);
CREATE INDEX idx_kariah_memberships_status ON public.kariah_memberships(status);
CREATE INDEX idx_kariah_memberships_membership_number ON public.kariah_memberships(membership_number);
CREATE INDEX idx_kariah_memberships_joined_date ON public.kariah_memberships(joined_date DESC);

-- Enable Row Level Security
ALTER TABLE public.kariah_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own membership
CREATE POLICY "Users can view own membership" ON public.kariah_memberships
    FOR SELECT USING (user_id = auth.uid());

-- RLS Policy: Mosque admins can manage memberships for their mosque
CREATE POLICY "Mosque admins can manage memberships" ON public.kariah_memberships
    FOR ALL USING (
        mosque_id IN (
            SELECT m.id FROM public.mosques m 
            WHERE m.user_id = auth.uid()
        )
    );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kariah_memberships TO authenticated;
GRANT SELECT ON public.kariah_memberships TO anon;

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_kariah_memberships_updated_at
    BEFORE UPDATE ON public.kariah_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate membership number
CREATE OR REPLACE FUNCTION generate_membership_number(mosque_id_param uuid)
RETURNS varchar(50) AS $$
DECLARE
    mosque_code varchar(10);
    sequence_num integer;
    membership_num varchar(50);
BEGIN
    -- Get mosque code (first 3 letters of mosque name, cleaned of non-alphabetic characters)
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 3))
    INTO mosque_code
    FROM public.mosques
    WHERE id = mosque_id_param;
    
    -- Fallback to 'MSQ' if mosque name is too short or not found
    IF mosque_code IS NULL OR LENGTH(mosque_code) < 3 THEN
        mosque_code := 'MSQ';
    END IF;
    
    -- Get next sequence number for this mosque
    SELECT COALESCE(MAX(CAST(SUBSTRING(membership_number FROM '[0-9]+$') AS integer)), 0) + 1
    INTO sequence_num
    FROM public.kariah_memberships
    WHERE mosque_id = mosque_id_param
    AND membership_number ~ (mosque_code || '[0-9]+$');
    
    -- Generate membership number with 4-digit padding
    membership_num := mosque_code || LPAD(sequence_num::text, 4, '0');
    
    RETURN membership_num;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically generate membership number on insert
CREATE OR REPLACE FUNCTION auto_generate_membership_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if membership_number is not provided
    IF NEW.membership_number IS NULL THEN
        NEW.membership_number := generate_membership_number(NEW.mosque_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate membership number
CREATE TRIGGER auto_generate_membership_number_trigger
    BEFORE INSERT ON public.kariah_memberships
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_membership_number();

-- Function to update legacy records count and total amount
CREATE OR REPLACE FUNCTION update_membership_legacy_stats(membership_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.kariah_memberships
    SET 
        legacy_records_count = (
            SELECT COUNT(*)
            FROM public.legacy_khairat_records lr
            WHERE lr.matched_user_id = kariah_memberships.user_id
            AND lr.mosque_id = kariah_memberships.mosque_id
            AND lr.is_matched = true
        ),
        total_legacy_amount = (
            SELECT COALESCE(SUM(lr.amount), 0)
            FROM public.legacy_khairat_records lr
            WHERE lr.matched_user_id = kariah_memberships.user_id
            AND lr.mosque_id = kariah_memberships.mosque_id
            AND lr.is_matched = true
        )
    WHERE id = membership_id;
END;
$$ LANGUAGE plpgsql;