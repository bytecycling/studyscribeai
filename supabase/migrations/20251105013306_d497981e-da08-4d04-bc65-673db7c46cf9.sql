-- Fix source_type constraint to include 'website'
ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_source_type_check;
ALTER TABLE public.notes ADD CONSTRAINT notes_source_type_check 
  CHECK (source_type IN ('pdf', 'audio', 'youtube', 'website'));