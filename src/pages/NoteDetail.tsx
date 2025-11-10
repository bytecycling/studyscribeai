import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import RichTextEditor from "@/components/RichTextEditor";
import ResizableSidebar from "@/components/ResizableSidebar";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const startEditing = () => {
    setEditedContent(note?.content || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedContent("");
  };

  const saveContent = async () => {
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
  };

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
    <main className="container mx-auto px-4 py-10 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{note.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(note.created_at).toLocaleString()} • {note.source_type}
          </p>
        </div>
        <Link to="/dashboard"><Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4"/>Back</Button></Link>
      </div>

      <div className={`transition-all duration-300 ${sidebarOpen ? 'mr-[420px]' : 'mr-0'}`}>
        <Card>
          <CardContent className="py-6">
            <div className="flex justify-end mb-4 gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={saveContent}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={startEditing}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Note
                </Button>
              )}
            </div>
            {isEditing ? (
              <RichTextEditor
                value={editedContent}
                onChange={setEditedContent}
              />
            ) : (
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {note.content}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {sidebarOpen && (
        <ResizableSidebar
          noteId={id}
          noteContent={note.content}
          highlights={highlights}
          flashcards={flashcards}
          quiz={quiz}
          rawText={note.raw_text || undefined}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {!sidebarOpen && (
        <Button
          className="fixed right-4 top-24 z-40"
          onClick={() => setSidebarOpen(true)}
        >
          Open AI Assistant
        </Button>
      )}
    </main>
  );
}
