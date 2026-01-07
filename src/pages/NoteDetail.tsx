import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit2, Save, X, PanelRightClose, PanelRight, RefreshCw, PlayCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import RichTextEditor from "@/components/RichTextEditor";
import ResizableSidebar from "@/components/ResizableSidebar";
import MermaidDiagram from "@/components/MermaidDiagram";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import GeneratingLoader from "@/components/GeneratingLoader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface NoteRow {
  id: string;
  title: string;
  content: string;
  source_type: string;
  source_url?: string | null;
  created_at: string;
  highlights?: any;
  flashcards?: any;
  quiz?: any;
  raw_text?: string | null;
}

// Check if notes are complete (has proper ending sections)
function isNotesComplete(content: string): boolean {
  if (!content) return false;
  const lowerContent = content.toLowerCase();
  // Check for key ending sections that indicate completeness
  const hasEnding = 
    lowerContent.includes("## 📝 summary") ||
    lowerContent.includes("## summary") ||
    lowerContent.includes("## 🎓 next steps") ||
    lowerContent.includes("## next steps") ||
    lowerContent.includes("end_of_notes");
  return hasEnding;
}

// Extract keywords from text for coverage checking
function extractKeywords(text: string): Set<string> {
  if (!text) return new Set();
  // Extract important words (capitalized, longer words, etc.)
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4)
    .map(w => w.toLowerCase());
  return new Set(words);
}

// Check source coverage - returns percentage of source keywords found in notes
function checkSourceCoverage(rawText: string, notes: string): number {
  const sourceKeywords = extractKeywords(rawText);
  const noteKeywords = extractKeywords(notes);
  if (sourceKeywords.size === 0) return 100;
  let covered = 0;
  sourceKeywords.forEach(keyword => {
    if (noteKeywords.has(keyword)) covered++;
  });
  return Math.round((covered / sourceKeywords.size) * 100);
}

export default function NoteDetail() {
  const { id } = useParams();
  const [note, setNote] = useState<NoteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenProgress, setRegenProgress] = useState(0);
  const [isContinuing, setIsContinuing] = useState(false);
  const [continueProgress, setContinueProgress] = useState(0);
  const { toast } = useToast();

  // Check if notes are complete
  const notesComplete = useMemo(() => {
    return note?.content ? isNotesComplete(note.content) : false;
  }, [note?.content]);

  // Check source coverage
  const sourceCoverage = useMemo(() => {
    if (!note?.raw_text || !note?.content) return 100;
    return checkSourceCoverage(note.raw_text, note.content);
  }, [note?.raw_text, note?.content]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) {
          setError("Missing note id");
          return;
        }
        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          setError("Note not found");
          return;
        }
        setNote(data as NoteRow);
      } catch (e: any) {
        console.error("load note error", e);
        setError(e.message || "Failed to load note");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (note?.title) {
      document.title = `${note.title} | Study Notes`;
    }
  }, [note]);

  const startEditing = useCallback(() => {
    setEditedContent(note?.content || "");
    setIsEditing(true);
  }, [note?.content]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditedContent("");
  }, []);

  const saveContent = useCallback(async () => {
    if (!note || !editedContent.trim()) {
      toast({
        title: "Error",
        description: "Content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({ content: editedContent.trim() })
        .eq('id', note.id);

      if (error) throw error;

      setNote({ ...note, content: editedContent.trim() });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Note content updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note content",
        variant: "destructive",
      });
    }
  }, [note, editedContent, toast]);

  const handleToggleSidebar = useCallback(() => {
    setShowSidebar(prev => !prev);
  }, []);

  const handleRegenerateNotes = useCallback(async () => {
    if (!note?.raw_text) {
      toast({
        title: "Cannot Regenerate",
        description: "No source content available for regeneration",
        variant: "destructive",
      });
      return;
    }

    setIsRegenerating(true);
    setRegenProgress(10);

    const interval = window.setInterval(() => {
      setRegenProgress((p) => {
        if (p >= 92) return 92;
        const next = p + (p < 60 ? 6 : 3);
        return Math.min(next, 92);
      });
    }, 450);

    try {
      const { data, error } = await supabase.functions.invoke("generate-study-pack", {
        body: { text: note.raw_text, title: note.title },
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      setRegenProgress(98);

      const { error: updateError } = await supabase
        .from("notes")
        .update({
          content: (data as any).notes,
          highlights: (data as any).highlights,
          flashcards: (data as any).flashcards,
          quiz: (data as any).quiz,
        })
        .eq("id", note.id);

      if (updateError) throw updateError;

      setNote({
        ...note,
        content: (data as any).notes,
        highlights: (data as any).highlights,
        flashcards: (data as any).flashcards,
        quiz: (data as any).quiz,
      });

      setRegenProgress(100);
      toast({
        title: "Success",
        description: "Notes regenerated successfully",
      });
    } catch (error: any) {
      console.error("Regenerate error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate notes",
        variant: "destructive",
      });
    } finally {
      window.clearInterval(interval);
      window.setTimeout(() => {
        setIsRegenerating(false);
        setRegenProgress(0);
      }, 250);
    }
  }, [note, toast]);

  // Continue writing incomplete notes
  const handleContinueWriting = useCallback(async () => {
    if (!note?.raw_text || !note?.content) {
      toast({
        title: "Cannot Continue",
        description: "No source content available",
        variant: "destructive",
      });
      return;
    }

    setIsContinuing(true);
    setContinueProgress(10);

    const interval = window.setInterval(() => {
      setContinueProgress((p) => {
        if (p >= 92) return 92;
        const next = p + (p < 60 ? 8 : 4);
        return Math.min(next, 92);
      });
    }, 400);

    try {
      const { data, error } = await supabase.functions.invoke("continue-notes", {
        body: { 
          currentNotes: note.content, 
          rawText: note.raw_text, 
          title: note.title 
        },
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      setContinueProgress(98);

      const newNotes = (data as any).notes;
      const isComplete = (data as any).isComplete;

      const { error: updateError } = await supabase
        .from("notes")
        .update({ content: newNotes })
        .eq("id", note.id);

      if (updateError) throw updateError;

      setNote({ ...note, content: newNotes });
      setContinueProgress(100);

      toast({
        title: isComplete ? "Notes Completed!" : "Notes Extended",
        description: isComplete 
          ? "Notes have been fully completed" 
          : "Notes extended but may still be incomplete. Try again if needed.",
      });
    } catch (error: any) {
      console.error("Continue error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to continue notes",
        variant: "destructive",
      });
    } finally {
      window.clearInterval(interval);
      window.setTimeout(() => {
        setIsContinuing(false);
        setContinueProgress(0);
      }, 250);
    }
  }, [note, toast]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: useCallback(() => {
      if (isEditing) saveContent();
    }, [isEditing, saveContent]),
    onEdit: useCallback(() => {
      if (!isEditing && note) startEditing();
    }, [isEditing, note, startEditing]),
    onToggleSidebar: handleToggleSidebar,
    onCancel: useCallback(() => {
      if (isEditing) cancelEditing();
    }, [isEditing, cancelEditing]),
  });

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-10">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (error || !note) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Link to="/dashboard"><Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4"/>Back</Button></Link>
        <Card className="mt-6"><CardContent className="py-10"><p className="text-destructive">{error || "Not found"}</p></CardContent></Card>
      </main>
    );
  }

  const highlights = Array.isArray(note.highlights) ? note.highlights : [];
  const flashcards = Array.isArray(note.flashcards) ? note.flashcards : [];
  const quiz = Array.isArray(note.quiz) ? note.quiz : [];


  return (
    <main className="h-screen overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Notes Panel */}
        <ResizablePanel defaultSize={showSidebar ? 50 : 100} minSize={30}>
          <div className="h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">{note.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(note.created_at).toLocaleString()} • {note.source_type}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowSidebar(!showSidebar)}
                      >
                        {showSidebar ? (
                          <PanelRightClose className="h-4 w-4" />
                        ) : (
                          <PanelRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {showSidebar ? "Hide AI Panel (⌘B)" : "Show AI Panel (⌘B)"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Link to="/dashboard">
                  <Button variant="ghost">
                    <ArrowLeft className="mr-2 h-4 w-4" />Back
                  </Button>
                </Link>
              </div>
            </div>

            <Card>
              <CardContent className="py-6">
                <div className="flex justify-end mb-4 gap-2">
                  {isEditing ? (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" onClick={saveContent}>
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Save (⌘S)</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Cancel (Esc)</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  ) : (
                    <>
                      {/* Continue Writing button - shows when notes are incomplete */}
                      {note.raw_text && !notesComplete && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={handleContinueWriting}
                                disabled={isContinuing}
                                className="bg-primary"
                              >
                                <PlayCircle className={isContinuing ? "w-4 h-4 mr-2 animate-pulse" : "w-4 h-4 mr-2"} />
                                {isContinuing ? "Continuing…" : "Continue Writing"}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Continue generating incomplete notes</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {note.raw_text && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleRegenerateNotes}
                                disabled={isRegenerating || isContinuing}
                              >
                                <RefreshCw className={isRegenerating ? "w-4 h-4 mr-2 animate-spin" : "w-4 h-4 mr-2"} />
                                {isRegenerating ? "Regenerating…" : "Regenerate"}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Regenerate notes from source</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="outline" onClick={startEditing} disabled={isContinuing}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Note
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit (⌘E)</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>

                {/* Incomplete notes warning */}
                {!notesComplete && note.raw_text && !isRegenerating && !isContinuing && (
                  <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertTitle className="text-amber-500">Notes Incomplete</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                      These notes appear to be cut off. Click "Continue Writing" to extend them, or "Regenerate" for a fresh generation.
                      {sourceCoverage < 70 && (
                        <span className="block mt-1 text-amber-600">
                          Source coverage: {sourceCoverage}% - some content may be missing.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {isContinuing && continueProgress > 0 ? (
                  <GeneratingLoader progress={continueProgress} title={`Continuing: ${note.title}`} />
                ) : isRegenerating && regenProgress > 0 ? (
                  <GeneratingLoader progress={regenProgress} title={note.title} />
                ) : isEditing ? (
                  <RichTextEditor value={editedContent} onChange={setEditedContent} />
                ) : (
                  <div className="prose prose-lg max-w-none dark:prose-invert prose-li:my-1 prose-ul:my-2 prose-ol:my-2">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        code({ node, className, children, ...props }) {
                          const match = /language-mermaid/.exec(className || '');
                          const content = String(children).replace(/\n$/, '');
                          if (match) {
                            return (
                              <MermaidDiagram 
                                chart={content} 
                                className="my-4"
                              />
                            );
                          }
                          // Check if it's an inline code or block
                          const isInline = !className;
                          if (isInline) {
                            return <code {...props}>{children}</code>;
                          }
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                        pre({ children, ...props }) {
                          // Check if this pre contains a mermaid code block
                          const child = children as any;
                          if (child?.props?.className?.includes('language-mermaid')) {
                            return <>{children}</>;
                          }
                          return <pre {...props}>{children}</pre>;
                        }
                      }}
                    >
                      {note.content}
                    </ReactMarkdown>
                  </div>
                )}
                
                
              </CardContent>
            </Card>
          </div>
        </ResizablePanel>

        {showSidebar && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={20}>
              <ResizableSidebar
                noteId={id}
                noteContent={note.content}
                highlights={highlights}
                flashcards={flashcards}
                quiz={quiz}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </main>
  );
}