-- Add structured study outputs to notes
ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS highlights jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS quiz jsonb,
ADD COLUMN IF NOT EXISTS raw_text text;

-- Optional index for searching highlights keywords later
CREATE INDEX IF NOT EXISTS idx_notes_highlights_gin ON public.notes USING GIN (highlights);
