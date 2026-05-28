-- Migration: Add image column to signalements table
-- Purpose: Support storing image URLs for reported issues

ALTER TABLE signalements 
ADD COLUMN IF NOT EXISTS image VARCHAR(500);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_signalements_image ON signalements(image);
