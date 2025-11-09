import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Youtube, FileAudio, FileText, Trash2, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Note {
  id: string;
  title: string;
  content: string;
  source_type: string;
  source_url?: string;
  created_at: string;
}

interface NotesListProps {
  refreshTrigger: number;
  folderId?: string | null;
}

const NotesList = ({ refreshTrigger, folderId }: NotesListProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [refreshTrigger, folderId]);

  const loadNotes = async () => {
    try {
      let query = supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes(data || []);
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
      default:
        return <FileText className="w-4 h-4" />;
    }
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
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <CardTitle className="text-lg truncate">{note.title}</CardTitle>
                  )}
                  <CardDescription>
                    {new Date(note.created_at).toLocaleDateString()} • {note.source_type}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
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
  );
};

export default NotesList;
