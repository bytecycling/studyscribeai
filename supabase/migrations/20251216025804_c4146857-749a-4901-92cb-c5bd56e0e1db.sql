-- Create table for quiz progress
CREATE TABLE public.quiz_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  selected_answer INTEGER,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, note_id, question_index)
);

-- Enable RLS
ALTER TABLE public.quiz_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own quiz progress"
ON public.quiz_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz progress"
ON public.quiz_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz progress"
ON public.quiz_progress
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quiz progress"
ON public.quiz_progress
FOR DELETE
USING (auth.uid() = user_id);