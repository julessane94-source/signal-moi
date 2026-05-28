-- Migration: Add image column to campagnes table
-- Purpose: Support storing image URLs for campaigns

ALTER TABLE IF EXISTS campagnes 
ADD COLUMN IF NOT EXISTS image VARCHAR(500);

ALTER TABLE IF EXISTS signal_moi.campagnes 
ADD COLUMN IF NOT EXISTS image VARCHAR(500);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_campagnes_image ON campagnes(image);
CREATE INDEX IF NOT EXISTS idx_signal_moi_campagnes_image ON signal_moi.campagnes(image);
