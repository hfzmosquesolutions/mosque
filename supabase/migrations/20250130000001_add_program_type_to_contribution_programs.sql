-- Add program_type to contribution_programs table for flexibility
ALTER TABLE public.contribution_programs 
ADD COLUMN program_type text DEFAULT 'khairat' CHECK (program_type IN ('khairat', 'zakat', 'infaq', 'sadaqah', 'general', 'education', 'maintenance'));

-- Add index for filtering by program type
CREATE INDEX idx_contribution_programs_program_type ON public.contribution_programs(program_type);

-- Update the comment to reflect the new field
COMMENT ON COLUMN contribution_programs.program_type IS 'Type of contribution program (khairat, zakat, infaq, sadaqah, general, education, maintenance)';

-- Set existing programs to 'khairat' by default (for backward compatibility)
UPDATE public.contribution_programs SET program_type = 'khairat' WHERE program_type IS NULL;