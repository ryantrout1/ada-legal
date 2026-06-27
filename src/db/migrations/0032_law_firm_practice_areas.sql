-- Phase B: practice areas live at the FIRM level (field split confirmed).
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS practice_areas jsonb NOT NULL DEFAULT '[]'::jsonb;
