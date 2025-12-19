-- Add images column to notes table for storing extracted images from sources
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS images jsonb DEFAULT NULL;