import { useState, useEffect } from "react";
import { MessageSquare, Layers, HelpCircle, Languages, Calculator, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AiChat from "./AiChat";
import InteractiveQuiz from "./InteractiveQuiz";
import DesmosCalculator from "./DesmosCalculator";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResizableSidebarProps {
  noteId?: string;
  noteContent: string;
  highlights?: any[];
  flashcards?: any[];
  quiz?: any[];
}

type SidebarView = "chat" | "flashcards" | "quiz" | "translate";

export default function ResizableSidebar({
  noteId,
  noteContent,
  highlights = [],
  flashcards = [],
  quiz = [],
}: ResizableSidebarProps) {
  const [currentView, setCurrentView] = useState<SidebarView>("chat");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isMathRelated, setIsMathRelated] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any[]>(quiz);
  const { toast } = useToast();

  // Check if note content is math-related
  useEffect(() => {
    if (noteContent) {
      const mathKeywords = [
        "math", "mathematics", "equation", "formula", "algebra", "calculus",
        "geometry", "trigonometry", "derivative", "integral", "function",
        "graph", "polynomial", "quadratic", "linear", "exponential",
        "logarithm", "sin", "cos", "tan", "sqrt", "π", "∑", "∫", "∂",
        "matrix", "vector", "theorem", "proof", "calculate", "solve"
      ];
      const lowerContent = noteContent.toLowerCase();
      const hasMath = mathKeywords.some(keyword => lowerContent.includes(keyword));
      setIsMathRelated(hasMath);
    }
  }, [noteContent]);

  // Update quiz when prop changes
  useEffect(() => {
    setCurrentQuiz(quiz);
  }, [quiz]);

  const languages = [
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" },
    { value: "italian", label: "Italian" },
    { value: "portuguese", label: "Portuguese" },
    { value: "chinese", label: "Chinese" },
    { value: "japanese", label: "Japanese" },
    { value: "korean", label: "Korean" },
    { value: "arabic", label: "Arabic" },
    { value: "russian", label: "Russian" },
    { value: "hindi", label: "Hindi" },
  ];

  const handleTranslate = async () => {
    if (!selectedLanguage) return;

    setIsTranslating(true);
    setTranslatedContent(null);

    try {
      const { data, error } = await supabase.functions.invoke('translate-note', {
        body: {
          content: noteContent,
          targetLanguage: languages.find(l => l.value === selectedLanguage)?.label || selectedLanguage
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setTranslatedContent(data.translatedContent);
      toast({
        title: "Success",
        description: `Translated to ${languages.find(l => l.value === selectedLanguage)?.label}`,
      });
    } catch (error: any) {
      console.error('Translation error:', error);
      toast({
        title: "Translation Error",
        description: error.message || "Failed to translate content",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGenerateMoreQuiz = async () => {
    if (!noteId || !noteContent) return;

    setIsGeneratingQuiz(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-study-pack', {
        body: { content: noteContent, type: 'quiz' }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.quiz) {
        setCurrentQuiz(prev => [...prev, ...data.quiz]);
        
        // Update the note with new quiz questions
        await supabase
          .from('notes')
          .update({ quiz: [...currentQuiz, ...data.quiz] })
          .eq('id', noteId);

        toast({
          title: "Success",
          description: `Added ${data.quiz.length} new questions`,
        });
      }
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate quiz questions",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const iconButtons = [
    { id: "chat" as SidebarView, icon: MessageSquare, label: "AI Chat" },
    { id: "flashcards" as SidebarView, icon: Layers, label: "Flashcards" },
    { id: "quiz" as SidebarView, icon: HelpCircle, label: "Quiz" },
    { id: "translate" as SidebarView, icon: Languages, label: "Translate" },
  ];

  return (
    <div className="h-full bg-background border-l border-border flex flex-col">
      {/* Icon Navigation - Takes up half the width */}
      <div className="flex items-center justify-between border-b border-border">
        <TooltipProvider>
          <div className="flex flex-1">
            {iconButtons.map((btn) => (
              <Tooltip key={btn.id}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={currentView === btn.id ? "default" : "ghost"}
                    onClick={() => setCurrentView(btn.id)}
                    className="flex-1 rounded-none h-12 flex items-center justify-center gap-2"
                  >
                    <btn.icon className="w-4 h-4" />
                    <span className="text-xs hidden sm:inline">{btn.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{btn.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
        
        {/* Calculator button for math-related notes */}
        {isMathRelated && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={showCalculator ? "default" : "outline"}
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="h-12 px-3 rounded-none border-l"
                >
                  <Calculator className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Desmos Calculator</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Calculator Panel */}
      {showCalculator && isMathRelated && (
        <div className="border-b border-border">
          <DesmosCalculator onClose={() => setShowCalculator(false)} />
        </div>
      )}

      {/* Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {currentView === "chat" && (
            <AiChat noteId={noteId} noteContent={noteContent} />
          )}

          {currentView === "flashcards" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Flashcards</h3>
              {flashcards.length > 0 ? (
                flashcards.map((card: any, i: number) => (
                  <div key={i} className="border border-border rounded-lg p-4 space-y-2">
                    <p className="font-medium">Q: {card.question}</p>
                    <p className="text-muted-foreground">A: {card.answer}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No flashcards available</p>
              )}
            </div>
          )}

          {currentView === "quiz" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Quiz</h3>
              <InteractiveQuiz
                noteId={noteId}
                noteContent={noteContent}
                quiz={currentQuiz}
                onGenerateMore={handleGenerateMoreQuiz}
                isGenerating={isGeneratingQuiz}
              />
            </div>
          )}

          {currentView === "translate" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Translate Notes</h3>
              <div className="flex flex-col gap-3">
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleTranslate} 
                  disabled={!selectedLanguage || isTranslating}
                  className="w-full"
                >
                  {isTranslating ? "Translating..." : "Translate"}
                </Button>
              </div>

              {translatedContent && (
                <div className="prose prose-sm dark:prose-invert max-w-none mt-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
                    {translatedContent}
                  </ReactMarkdown>
                </div>
              )}

              {!translatedContent && !isTranslating && (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  Select a language and click translate
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
