-- Add structured address fields to mosques table
ALTER TABLE mosques 
ADD COLUMN address_line1 TEXT,
ADD COLUMN address_line2 TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN postcode TEXT,
ADD COLUMN country TEXT DEFAULT 'Malaysia';

-- Create index for better search performance
CREATE INDEX idx_mosques_state ON mosques(state);
CREATE INDEX idx_mosques_city ON mosques(city);
CREATE INDEX idx_mosques_postcode ON mosques(postcode);

-- Add comments for documentation
COMMENT ON COLUMN mosques.address_line1 IS 'Primary address line (street, building name, etc.)';
COMMENT ON COLUMN mosques.address_line2 IS 'Secondary address line (apartment, suite, unit, etc.)';
COMMENT ON COLUMN mosques.city IS 'City name';
COMMENT ON COLUMN mosques.state IS 'State or federal territory';
COMMENT ON COLUMN mosques.postcode IS 'Postal code';
COMMENT ON COLUMN mosques.country IS 'Country (defaults to Malaysia)';
