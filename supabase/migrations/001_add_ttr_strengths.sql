-- Migration: TTR-Rating und Stärken zu pc_profiles hinzufügen
-- Ausführen im Supabase Dashboard → SQL Editor

ALTER TABLE pc_profiles ADD COLUMN IF NOT EXISTS ttr_rating SMALLINT CHECK (ttr_rating BETWEEN 0 AND 3000);
ALTER TABLE pc_profiles ADD COLUMN IF NOT EXISTS strengths TEXT[] DEFAULT '{}';
