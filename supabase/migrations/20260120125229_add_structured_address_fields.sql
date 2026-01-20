/*
  # Add Structured Address Fields

  1. Changes
    - Add new columns to `addresses` table for structured address data:
      - `salutation` (text) - Mr., Mrs., Ms., Dr., etc.
      - `first_name` (text) - Person's first name
      - `last_name` (text) - Person's last name
      - `street_name` (text) - Name of the street
      - `street_number` (text) - Street number
      - `postal_code` (text) - Postal/ZIP code
      - `place` (text) - City/Town name
    
  2. Notes
    - All new fields are nullable since existing records won't have this data
    - These fields will be populated by ChatGPT parsing after OCR
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addresses' AND column_name = 'salutation'
  ) THEN
    ALTER TABLE addresses ADD COLUMN salutation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addresses' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE addresses ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addresses' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE addresses ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addresses' AND column_name = 'street_name'
  ) THEN
    ALTER TABLE addresses ADD COLUMN street_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addresses' AND column_name = 'street_number'
  ) THEN
    ALTER TABLE addresses ADD COLUMN street_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addresses' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE addresses ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addresses' AND column_name = 'place'
  ) THEN
    ALTER TABLE addresses ADD COLUMN place text;
  END IF;
END $$;