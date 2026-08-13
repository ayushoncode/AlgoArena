-- Add missing difficulty column to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10);

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'matches' ORDER BY ordinal_position;
