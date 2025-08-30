-- Add fixed_price field to contribution_programs table
-- This allows mosque admins to set a fixed price per payment for contribution programs
-- instead of allowing users to pay any amount they want

ALTER TABLE public.contribution_programs 
ADD COLUMN fixed_price numeric;

-- Add comment to document the column purpose
COMMENT ON COLUMN contribution_programs.fixed_price IS 'Fixed price per payment for this program. If set, users must pay this exact amount. If null, users can pay any amount they want.';

-- Add index for filtering by fixed price programs (optional but recommended for performance)
CREATE INDEX idx_contribution_programs_fixed_price ON public.contribution_programs(fixed_price) WHERE fixed_price IS NOT NULL;