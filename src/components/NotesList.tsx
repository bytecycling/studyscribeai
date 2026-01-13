import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Youtube, FileAudio, FileText, Trash2, Edit2, Check, X, PlayCircle, RefreshCw, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Note {
  id: string;
  title: string;
  content: string;
  raw_text?: string | null;
  source_type: string;
  source_url?: string;
  created_at: string;
  is_complete: boolean;
  activity_log?: any[];
}

interface NotesListProps {
  refreshTrigger: number;
  folderId?: string | null;
}

const RATE_LIMIT_DELAY = 2000; // 2 seconds between each note continuation

const NotesList = ({ refreshTrigger, folderId }: NotesListProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [continuingId, setContinuingId] = useState<string | null>(null);
  const [bulkContinuing, setBulkContinuing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentNote: "" });
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [refreshTrigger, folderId]);

  const loadNotes = async () => {
    try {
      let query = supabase
        .from('notes')
        .select('id, title, content, raw_text, source_type, source_url, created_at, is_complete, activity_log')
        .order('created_at', { ascending: false });

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes((data as Note[]) || []);
    } catch (error: any) {
      console.error('Error loading notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note deleted successfully",
      });

      loadNotes();
    } catch (error: any) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const saveTitle = async (id: string) => {
    if (!editTitle.trim()) {
      toast({
        title: "Error",
        description: "Title cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({ title: editTitle.trim() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note renamed successfully",
      });

      setEditingId(null);
      loadNotes();
    } catch (error: any) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to rename note",
        variant: "destructive",
      });
    }
  };

  const moveNoteToFolder = async (noteId: string, targetFolderId: string | null) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ folder_id: targetFolderId })
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: targetFolderId ? "Note moved to folder" : "Note moved to all notes",
      });

      loadNotes();
    } catch (error: any) {
      console.error('Error moving note:', error);
      toast({
        title: "Error",
        description: "Failed to move note",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (noteId: string) => {
    setDraggedNoteId(noteId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    if (draggedNoteId) {
      moveNoteToFolder(draggedNoteId, targetFolderId);
      setDraggedNoteId(null);
    }
  };

  const getIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      case 'audio':
      case 'video':
        return <FileAudio className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'website':
        return <Globe className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const continueNote = async (note: Note, showToast = true): Promise<boolean> => {
    if (!note.raw_text || !note.content) {
      if (showToast) {
        toast({
          title: "Cannot Continue",
          description: "This note has no saved source text to continue from.",
          variant: "destructive",
        });
      }
      return false;
    }

    setContinuingId(note.id);
    try {
      const { data, error } = await supabase.functions.invoke("continue-notes", {
        body: {
          currentNotes: note.content,
          rawText: note.raw_text,
          title: note.title,
        },
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const newNotes = (data as any).notes as string;
      const isComplete = Boolean((data as any).isComplete);
      const newActivityLog = (data as any).activityLog || [];

      // Merge activity logs
      const existingLog = Array.isArray(note.activity_log) ? note.activity_log : [];
      const mergedLog = [...existingLog, ...newActivityLog];

      const { error: updateError } = await supabase
        .from("notes")
        .update({ 
          content: newNotes, 
          is_complete: isComplete,
          activity_log: mergedLog as any
        })
        .eq("id", note.id);

      if (updateError) throw updateError;

      if (showToast) {
        toast({
          title: isComplete ? "Notes Completed!" : "Notes Extended",
          description: isComplete
            ? "This note is now complete."
            : "Extended, but it may still be incomplete—run Continue again if needed.",
        });
      }

      await loadNotes();
      return isComplete;
    } catch (e: any) {
      console.error("continueNote error", e);
      if (showToast) {
        toast({
          title: "Error",
          description: e.message || "Failed to continue note",
          variant: "destructive",
        });
      }
      return false;
    } finally {
      setContinuingId(null);
    }
  };

  const incompleteNotes = notes.filter(n => !n.is_complete && n.raw_text);

  const handleBulkContinue = async () => {
    if (incompleteNotes.length === 0) {
      toast({
        title: "No Incomplete Notes",
        description: "All notes are already complete!",
      });
      return;
    }

    setBulkContinuing(true);
    setBulkProgress({ current: 0, total: incompleteNotes.length, currentNote: "" });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < incompleteNotes.length; i++) {
      const note = incompleteNotes[i];
      setBulkProgress({ current: i + 1, total: incompleteNotes.length, currentNote: note.title });

      const success = await continueNote(note, false);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Rate limiting - wait between requests
      if (i < incompleteNotes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }

    setBulkContinuing(false);
    setBulkProgress({ current: 0, total: 0, currentNote: "" });

    toast({
      title: "Bulk Continue Complete",
      description: `Completed: ${successCount}, Still incomplete: ${failCount}`,
    });

    await loadNotes();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading notes...</p>
        </CardContent>
      </Card>
    );
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No study notes yet. Start by uploading your first learning material!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Continue Action */}
      {incompleteNotes.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4">
            {bulkContinuing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Continuing note {bulkProgress.current} of {bulkProgress.total}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {bulkProgress.currentNote}
                  </span>
                </div>
                <Progress value={(bulkProgress.current / bulkProgress.total) * 100} />
                <p className="text-xs text-muted-foreground text-center">
                  Please wait... Processing with rate limiting to avoid overload.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    {incompleteNotes.length} incomplete note{incompleteNotes.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    These notes were cut off during generation
                  </p>
                </div>
                <Button
                  onClick={handleBulkContinue}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Continue All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div className="grid gap-4">
        {notes.map((note) => (
          <Card 
            key={note.id} 
            className="hover:shadow-elevated transition-all cursor-move"
            draggable
            onDragStart={() => handleDragStart(note.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, folderId)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {getIcon(note.source_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingId === note.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="text-lg font-semibold h-8"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveTitle(note.id);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveTitle(note.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <CardTitle className="text-lg truncate">{note.title}</CardTitle>
                        {!note.is_complete && (
                          <Badge variant="secondary" className="shrink-0 bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            Incomplete
                          </Badge>
                        )}
                      </div>
                    )}
                    <CardDescription>
                      {new Date(note.created_at).toLocaleDateString()} • {note.source_type}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!note.is_complete && note.raw_text && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => continueNote(note)}
                      disabled={continuingId === note.id || bulkContinuing}
                    >
                      <PlayCircle className={continuingId === note.id ? "w-4 h-4 mr-2 animate-pulse" : "w-4 h-4 mr-2"} />
                      {continuingId === note.id ? "Continuing…" : "Continue"}
                    </Button>
                  )}
                  <Link to={`/note/${note.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(note)}
                    disabled={editingId === note.id}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNote(note.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {note.content.substring(0, 200)}...
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NotesList;
