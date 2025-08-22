-- Add bill_id column to contributions table for direct payment provider bill ID storage
ALTER TABLE contributions 
ADD COLUMN bill_id TEXT;

-- Add index for faster lookups by bill_id
CREATE INDEX idx_contributions_bill_id ON contributions(bill_id);

-- Add comment to explain the column
COMMENT ON COLUMN contributions.bill_id IS 'Direct storage of payment provider bill ID (e.g., Billplz bill ID) for simplified lookups';