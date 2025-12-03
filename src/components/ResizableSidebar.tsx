import { useState } from "react";
import { MessageSquare, Layers, HelpCircle, FileType, Languages } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AiChat from "./AiChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResizableSidebarProps {
  noteId?: string;
  noteContent: string;
  highlights?: any[];
  flashcards?: any[];
  quiz?: any[];
  rawText?: string;
}

type SidebarView = "chat" | "flashcards" | "quiz" | "transcript" | "translate";

export default function ResizableSidebar({
  noteId,
  noteContent,
  highlights = [],
  flashcards = [],
  quiz = [],
  rawText,
}: ResizableSidebarProps) {
  const [currentView, setCurrentView] = useState<SidebarView>("chat");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

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

  const iconButtons = [
    { id: "chat" as SidebarView, icon: MessageSquare, label: "AI Chat" },
    { id: "flashcards" as SidebarView, icon: Layers, label: "Flashcards" },
    { id: "quiz" as SidebarView, icon: HelpCircle, label: "Quiz" },
    { id: "transcript" as SidebarView, icon: FileType, label: "Transcript" },
    { id: "translate" as SidebarView, icon: Languages, label: "Translate" },
  ];

  return (
    <div className="h-full bg-background border-l border-border flex flex-col">
      {/* Icon Navigation */}
      <div className="flex items-center border-b border-border p-2">
        <TooltipProvider>
          <div className="flex gap-1">
            {iconButtons.map((btn) => (
              <Tooltip key={btn.id}>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={currentView === btn.id ? "default" : "ghost"}
                    onClick={() => setCurrentView(btn.id)}
                  >
                    <btn.icon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{btn.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>

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
              <h3 className="font-semibold text-lg">Quiz Questions</h3>
              {quiz.length > 0 ? (
                quiz.map((q: any, i: number) => (
                  <div key={i} className="border border-border rounded-lg p-4 space-y-3">
                    <p className="font-medium">{i + 1}. {q.question}</p>
                    <div className="space-y-1 pl-4">
                      {q.options.map((opt: string, idx: number) => (
                        <div
                          key={idx}
                          className={`p-2 rounded ${
                            idx === q.correctIndex
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : "bg-muted"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}. {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No quiz questions available</p>
              )}
            </div>
          )}

          {currentView === "transcript" && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Original Transcript</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="whitespace-pre-wrap text-sm">{rawText || "No transcript available"}</p>
              </div>
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
                  <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
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