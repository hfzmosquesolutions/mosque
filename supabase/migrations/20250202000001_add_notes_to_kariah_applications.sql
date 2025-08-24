-- Add notes column to kariah_applications table
ALTER TABLE kariah_applications ADD COLUMN notes TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN kariah_applications.notes IS 'Additional notes provided by the applicant during kariah application';