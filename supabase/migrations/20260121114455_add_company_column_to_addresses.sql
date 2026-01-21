/*
  # Add company column to addresses table

  1. Changes
    - Add `company` (text, nullable) column to addresses table for storing company names
    
  2. Indexes
    - Add index on `company` for faster search
    - Add index on `last_name` for faster search
    - Add index on `place` for faster search
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addresses' AND column_name = 'company'
  ) THEN
    ALTER TABLE addresses ADD COLUMN company text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_addresses_company ON addresses(company);
CREATE INDEX IF NOT EXISTS idx_addresses_last_name ON addresses(last_name);
CREATE INDEX IF NOT EXISTS idx_addresses_place ON addresses(place);