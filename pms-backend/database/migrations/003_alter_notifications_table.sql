-- Migration: Update Notifications Table for Event Processing System
-- Adds columns to link notifications with events and track read status

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_type VARCHAR(100);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Remove old columns that are no longer needed
ALTER TABLE notifications DROP COLUMN IF EXISTS channel;
ALTER TABLE notifications DROP COLUMN IF EXISTS status;
ALTER TABLE notifications DROP COLUMN IF EXISTS sent_at;

-- Add index for user queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
