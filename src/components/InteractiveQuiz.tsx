import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizProgress {
  question_index: number;
  selected_answer: number | null;
  is_correct: boolean;
}

interface InteractiveQuizProps {
  noteId?: string;
  noteContent: string;
  quiz: QuizQuestion[];
  onGenerateMore?: () => void;
  isGenerating?: boolean;
}

export default function InteractiveQuiz({
  noteId,
  noteContent,
  quiz,
  onGenerateMore,
  isGenerating,
}: InteractiveQuizProps) {
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load progress from database
  useEffect(() => {
    const loadProgress = async () => {
      if (!noteId) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("quiz_progress")
          .select("*")
          .eq("note_id", noteId)
          .eq("user_id", user.id);

        if (error) throw error;

        if (data) {
          const answersMap: Record<number, number | null> = {};
          const submittedMap: Record<number, boolean> = {};
          
          data.forEach((progress: QuizProgress) => {
            answersMap[progress.question_index] = progress.selected_answer;
            submittedMap[progress.question_index] = true;
          });

          setAnswers(answersMap);
          setSubmitted(submittedMap);
        }
      } catch (error) {
        console.error("Error loading quiz progress:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [noteId]);

  const handleSelectAnswer = async (questionIndex: number, optionIndex: number) => {
    if (submitted[questionIndex]) return;

    const isCorrect = optionIndex === quiz[questionIndex].correctIndex;
    
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
    setSubmitted((prev) => ({ ...prev, [questionIndex]: true }));

    // Save to database
    if (noteId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("quiz_progress").upsert({
            user_id: user.id,
            note_id: noteId,
            question_index: questionIndex,
            selected_answer: optionIndex,
            is_correct: isCorrect,
          }, {
            onConflict: "user_id,note_id,question_index"
          });
        }
      } catch (error) {
        console.error("Error saving quiz progress:", error);
      }
    }
  };

  const resetQuiz = async () => {
    if (!noteId) {
      setAnswers({});
      setSubmitted({});
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("quiz_progress")
          .delete()
          .eq("note_id", noteId)
          .eq("user_id", user.id);
      }
      
      setAnswers({});
      setSubmitted({});
      
      toast({
        title: "Quiz Reset",
        description: "Your progress has been cleared",
      });
    } catch (error) {
      console.error("Error resetting quiz:", error);
      toast({
        title: "Error",
        description: "Failed to reset quiz",
        variant: "destructive",
      });
    }
  };

  const correctCount = Object.entries(submitted).filter(
    ([idx, isSubmitted]) => isSubmitted && answers[Number(idx)] === quiz[Number(idx)]?.correctIndex
  ).length;
  
  const wrongCount = Object.entries(submitted).filter(
    ([idx, isSubmitted]) => isSubmitted && answers[Number(idx)] !== quiz[Number(idx)]?.correctIndex
  ).length;

  const totalAnswered = correctCount + wrongCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (quiz.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No quiz questions available</p>
        {onGenerateMore && (
          <Button onClick={onGenerateMore} className="mt-4" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Quiz Questions"
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score Display */}
      {totalAnswered > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">{correctCount} Correct</span>
                </div>
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4" />
                  <span className="font-medium">{wrongCount} Wrong</span>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {totalAnswered}/{quiz.length} answered
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Questions */}
      {quiz.map((q, i) => (
        <Card key={i} className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              {i + 1}. {q.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.options.map((opt, idx) => {
              const isSelected = answers[i] === idx;
              const isCorrectAnswer = idx === q.correctIndex;
              const hasSubmitted = submitted[i];

              let className = "p-3 rounded-lg cursor-pointer transition-all border ";
              
              if (hasSubmitted) {
                if (isCorrectAnswer) {
                  className += "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400";
                } else if (isSelected && !isCorrectAnswer) {
                  className += "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400";
                } else {
                  className += "bg-muted/50 border-transparent text-muted-foreground";
                }
              } else {
                className += "hover:bg-primary/10 hover:border-primary border-border";
              }

              return (
                <div
                  key={idx}
                  className={className}
                  onClick={() => handleSelectAnswer(i, idx)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span>{opt}</span>
                    {hasSubmitted && isCorrectAnswer && (
                      <CheckCircle className="w-4 h-4 ml-auto text-green-600" />
                    )}
                    {hasSubmitted && isSelected && !isCorrectAnswer && (
                      <XCircle className="w-4 h-4 ml-auto text-red-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={resetQuiz} className="flex-1">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset Quiz
        </Button>
        {onGenerateMore && (
          <Button onClick={onGenerateMore} className="flex-1" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate More"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
