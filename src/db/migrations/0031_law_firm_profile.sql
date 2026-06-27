-- Phase A: firm becomes a first-class record with its own public face.
-- Additive, constant-default ADD COLUMNs — no table rewrite, no lock risk.
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS location_city text;
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS location_state text;
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS additional_states jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS serves_nationwide boolean NOT NULL DEFAULT false;
