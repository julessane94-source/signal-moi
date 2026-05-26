-- Migration: Add images column to signalements
-- Adds support for multiple image URLs stored as JSON array

ALTER TABLE signal_moi.signalements 
ADD COLUMN IF NOT EXISTS images TEXT DEFAULT '[]';

-- Create index for better performance when querying
CREATE INDEX IF NOT EXISTS idx_signalements_created_at ON signal_moi.signalements(created_at);
