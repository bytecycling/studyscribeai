import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit2, Save, X, PanelRightClose, PanelRight, RefreshCw } from "lucide-react";
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
  const { toast } = useToast();

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
                      {note.raw_text && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleRegenerateNotes}
                                disabled={isRegenerating}
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
                            <Button size="sm" variant="outline" onClick={startEditing}>
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
                {isRegenerating && regenProgress > 0 ? (
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