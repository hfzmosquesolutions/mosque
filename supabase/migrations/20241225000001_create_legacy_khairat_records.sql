-- Create legacy khairat records table
CREATE TABLE public.legacy_khairat_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mosque_id uuid NOT NULL,
    ic_passport_number varchar(20) NOT NULL,
    full_name varchar(255) NOT NULL,
    address_line1 text,
    address_line2 text,
    address_line3 text,
    invoice_number varchar(100),
    payment_date date NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method varchar(50),
    description text,
    customer_po varchar(100),
    item_number varchar(50),
    sale_status varchar(50),
    is_matched boolean DEFAULT false,
    matched_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid NOT NULL,
    CONSTRAINT legacy_khairat_records_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES public.mosques(id),
    CONSTRAINT legacy_khairat_records_matched_user_id_fkey FOREIGN KEY (matched_user_id) REFERENCES public.user_profiles(id),
    CONSTRAINT legacy_khairat_records_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id)
);

-- Create indexes for performance
CREATE INDEX idx_legacy_khairat_ic_passport ON public.legacy_khairat_records(ic_passport_number);
CREATE INDEX idx_legacy_khairat_mosque ON public.legacy_khairat_records(mosque_id);
CREATE INDEX idx_legacy_khairat_matched_user ON public.legacy_khairat_records(matched_user_id);
CREATE INDEX idx_legacy_khairat_payment_date ON public.legacy_khairat_records(payment_date DESC);
CREATE INDEX idx_legacy_khairat_is_matched ON public.legacy_khairat_records(is_matched);

-- Enable Row Level Security
ALTER TABLE public.legacy_khairat_records ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Mosque admins can manage legacy records for their mosque
CREATE POLICY "Mosque admins can manage legacy records" ON public.legacy_khairat_records
    FOR ALL USING (
        mosque_id IN (
            SELECT m.id FROM public.mosques m 
            WHERE m.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can view their matched legacy records
CREATE POLICY "Users can view their matched legacy records" ON public.legacy_khairat_records
    FOR SELECT USING (matched_user_id = auth.uid());

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legacy_khairat_records TO authenticated;
GRANT SELECT ON public.legacy_khairat_records TO anon;

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_legacy_khairat_records_updated_at
    BEFORE UPDATE ON public.legacy_khairat_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();