import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Youtube, FileAudio, FileText, Trash2, Eye } from "lucide-react";
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
}

const NotesList = ({ refreshTrigger }: NotesListProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [refreshTrigger]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

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
        <Card key={note.id} className="hover:shadow-elevated transition-all">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {getIcon(note.source_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{note.title}</CardTitle>
                  <CardDescription>
                    {new Date(note.created_at).toLocaleDateString()} • {note.source_type}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/note/${note.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
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
