-- Function to find legacy record matches by IC/Passport
CREATE OR REPLACE FUNCTION find_legacy_matches(ic_passport varchar(20), mosque_id_param uuid)
RETURNS TABLE(
    record_id uuid,
    full_name varchar(255),
    total_amount numeric,
    payment_count bigint,
    first_payment_date date,
    last_payment_date date
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lr.id,
        lr.full_name,
        SUM(lr.amount) as total_amount,
        COUNT(*) as payment_count,
        MIN(lr.payment_date) as first_payment_date,
        MAX(lr.payment_date) as last_payment_date
    FROM public.legacy_khairat_records lr
    WHERE lr.ic_passport_number = ic_passport
    AND lr.mosque_id = mosque_id_param
    AND lr.is_matched = false
    GROUP BY lr.id, lr.full_name
    ORDER BY SUM(lr.amount) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to match legacy records to a user
CREATE OR REPLACE FUNCTION match_legacy_records_to_user(
    user_id_param uuid,
    mosque_id_param uuid,
    ic_passport varchar(20)
)
RETURNS TABLE(
    matched_count integer,
    total_amount numeric
) AS $$
DECLARE
    match_count integer;
    match_total numeric;
BEGIN
    -- Update legacy records to mark them as matched
    UPDATE public.legacy_khairat_records
    SET 
        is_matched = true,
        matched_user_id = user_id_param,
        updated_at = now()
    WHERE ic_passport_number = ic_passport
    AND mosque_id = mosque_id_param
    AND is_matched = false;
    
    -- Get the count and total of matched records
    SELECT 
        COUNT(*)::integer,
        COALESCE(SUM(amount), 0)
    INTO match_count, match_total
    FROM public.legacy_khairat_records
    WHERE matched_user_id = user_id_param
    AND mosque_id = mosque_id_param
    AND is_matched = true;
    
    -- Update kariah membership stats if membership exists
    UPDATE public.kariah_memberships
    SET 
        legacy_records_count = match_count,
        total_legacy_amount = match_total,
        updated_at = now()
    WHERE user_id = user_id_param
    AND mosque_id = mosque_id_param;
    
    RETURN QUERY SELECT match_count, match_total;
END;
$$ LANGUAGE plpgsql;

-- Function to get combined payment history for a user
CREATE OR REPLACE FUNCTION get_combined_payment_history(
    user_id_param uuid,
    mosque_id_param uuid,
    start_date_param date DEFAULT NULL,
    end_date_param date DEFAULT NULL
)
RETURNS TABLE(
    payment_id uuid,
    payment_date date,
    amount numeric,
    description text,
    payment_method varchar(50),
    payment_type varchar(20),
    program_name varchar(255)
) AS $$
BEGIN
    RETURN QUERY
    -- Legacy payments
    SELECT 
        lr.id as payment_id,
        lr.payment_date,
        lr.amount,
        lr.description,
        lr.payment_method,
        'legacy'::varchar(20) as payment_type,
        'Legacy Khairat'::varchar(255) as program_name
    FROM public.legacy_khairat_records lr
    WHERE lr.matched_user_id = user_id_param
    AND lr.mosque_id = mosque_id_param
    AND lr.is_matched = true
    AND (start_date_param IS NULL OR lr.payment_date >= start_date_param)
    AND (end_date_param IS NULL OR lr.payment_date <= end_date_param)
    
    UNION ALL
    
    -- Current contributions
    SELECT 
        c.id as payment_id,
        c.contributed_at::date as payment_date,
        c.amount,
        cp.description,
        c.payment_method,
        'current'::varchar(20) as payment_type,
        cp.name as program_name
    FROM public.contributions c
    JOIN public.contribution_programs cp ON cp.id = c.program_id
    WHERE c.contributor_id = user_id_param
    AND cp.mosque_id = mosque_id_param
    AND c.status = 'completed'
    AND (start_date_param IS NULL OR c.contributed_at::date >= start_date_param)
    AND (end_date_param IS NULL OR c.contributed_at::date <= end_date_param)
    
    ORDER BY payment_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is kariah member
CREATE OR REPLACE FUNCTION is_kariah_member(user_id_param uuid, mosque_id_param uuid)
RETURNS boolean AS $$
DECLARE
    is_member boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.kariah_memberships
        WHERE user_id = user_id_param
        AND mosque_id = mosque_id_param
        AND status = 'active'
    ) INTO is_member;
    
    RETURN is_member;
END;
$$ LANGUAGE plpgsql;

-- Audit trigger function for legacy records
CREATE OR REPLACE FUNCTION audit_legacy_records()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert audit log entry
    INSERT INTO public.audit_logs (
        user_id, 
        mosque_id, 
        action, 
        table_name, 
        record_id, 
        old_values, 
        new_values,
        created_at
    ) VALUES (
        auth.uid(), 
        COALESCE(NEW.mosque_id, OLD.mosque_id),
        TG_OP,
        'legacy_khairat_records',
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        now()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger for legacy records
CREATE TRIGGER audit_legacy_records_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.legacy_khairat_records
    FOR EACH ROW EXECUTE FUNCTION audit_legacy_records();

-- Function to validate IC/Passport format
CREATE OR REPLACE FUNCTION validate_ic_passport(ic_passport varchar(20))
RETURNS boolean AS $$
BEGIN
    -- Malaysian IC format: 6 digits + 2 digits + 4 digits (YYMMDD-PB-NNNN)
    -- Passport format: 1 letter + 8 digits or similar international formats
    RETURN ic_passport ~ '^[0-9]{6}-?[0-9]{2}-?[0-9]{4}$' OR 
           ic_passport ~ '^[A-Z][0-9]{8}$' OR
           ic_passport ~ '^[A-Z]{1,2}[0-9]{6,9}$';
END;
$$ LANGUAGE plpgsql;

-- Function to get legacy data statistics for a mosque
CREATE OR REPLACE FUNCTION get_legacy_data_stats(mosque_id_param uuid)
RETURNS TABLE(
    total_records bigint,
    matched_records bigint,
    unmatched_records bigint,
    total_amount numeric,
    matched_amount numeric,
    unmatched_amount numeric,
    unique_contributors bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE is_matched = true) as matched_records,
        COUNT(*) FILTER (WHERE is_matched = false) as unmatched_records,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(amount) FILTER (WHERE is_matched = true), 0) as matched_amount,
        COALESCE(SUM(amount) FILTER (WHERE is_matched = false), 0) as unmatched_amount,
        COUNT(DISTINCT ic_passport_number) as unique_contributors
    FROM public.legacy_khairat_records
    WHERE mosque_id = mosque_id_param;
END;
$$ LANGUAGE plpgsql;