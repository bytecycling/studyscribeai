-- Add is_complete flag and activity_log to notes table
ALTER TABLE public.notes 
ADD COLUMN is_complete boolean NOT NULL DEFAULT false,
ADD COLUMN activity_log jsonb DEFAULT '[]'::jsonb;

-- Create index for faster incomplete notes queries
CREATE INDEX idx_notes_is_complete ON public.notes(is_complete) WHERE is_complete = false;

-- Update existing notes: mark as complete if they have the completion markers
UPDATE public.notes 
SET is_complete = true 
WHERE content ILIKE '%## 📝 Summary%' 
  AND content ILIKE '%## 🎓 Next Steps%';