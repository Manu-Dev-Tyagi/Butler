-- Migration: Update response_sheets table for snapshot functionality
-- Date: 2026-01-13

-- Add snapshot_data column (JSONB for storing complete project snapshot)
ALTER TABLE response_sheets ADD COLUMN IF NOT EXISTS snapshot_data JSONB;

-- Add sent_at column (timestamp when sheet was emailed)
ALTER TABLE response_sheets ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;

-- Add sent_to column (array of email addresses)
ALTER TABLE response_sheets ADD COLUMN IF NOT EXISTS sent_to TEXT[];

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_response_sheets_project_id ON response_sheets(project_id);
CREATE INDEX IF NOT EXISTS idx_response_sheets_generated_at ON response_sheets(generated_at);

-- Update existing rows to have empty snapshot_data (if any exist)
UPDATE response_sheets SET snapshot_data = '{}'::JSONB WHERE snapshot_data IS NULL;

-- Make snapshot_data NOT NULL after populating existing rows
ALTER TABLE response_sheets ALTER COLUMN snapshot_data SET NOT NULL;
