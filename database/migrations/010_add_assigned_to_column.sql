-- Migration: Add assigned_to column to signalements table for police officer assignment
-- Date: 2024

ALTER TABLE signal_moi.signalements
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(36) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS transferred_from VARCHAR(36) DEFAULT NULL;

-- Add foreign key constraints if needed
-- ALTER TABLE signal_moi.signalements
-- ADD CONSTRAINT fk_assigned_to_user FOREIGN KEY (assigned_to) REFERENCES signal_moi.users(id) ON DELETE SET NULL,
-- ADD CONSTRAINT fk_transferred_from_user FOREIGN KEY (transferred_from) REFERENCES signal_moi.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_signalements_assigned_to ON signal_moi.signalements(assigned_to);
CREATE INDEX IF NOT EXISTS idx_signalements_transferred_from ON signal_moi.signalements(transferred_from);
