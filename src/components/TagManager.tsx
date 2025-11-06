import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tag, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TagManagerProps {
  noteId?: string;
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;
}

const TagManager = ({ noteId, selectedTags = [], onTagsChange }: TagManagerProps) => {
  const [tags, setTags] = useState<any[]>([]);
  const [noteTags, setNoteTags] = useState<string[]>(selectedTags);
  const [newTagName, setNewTagName] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTags();
    if (noteId) {
      loadNoteTags();
    }
  }, [noteId]);

  const loadTags = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      console.error('Error loading tags:', error);
    }
  };

  const loadNoteTags = async () => {
    if (!noteId) return;

    try {
      const { data, error } = await supabase
        .from('note_tags')
        .select('tag_id, tags(name)')
        .eq('note_id', noteId);

      if (error) throw error;
      const tagNames = data?.map((nt: any) => nt.tags.name) || [];
      setNoteTags(tagNames);
      onTagsChange?.(tagNames);
    } catch (error: any) {
      console.error('Error loading note tags:', error);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tags')
        .insert([{ name: newTagName, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Tag created", description: `"${newTagName}" has been created` });
      setNewTagName('');
      setShowDialog(false);
      loadTags();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleTag = async (tagName: string) => {
    if (!noteId) {
      // If no noteId, just update local state
      const newTags = noteTags.includes(tagName)
        ? noteTags.filter(t => t !== tagName)
        : [...noteTags, tagName];
      setNoteTags(newTags);
      onTagsChange?.(newTags);
      return;
    }

    const tag = tags.find(t => t.name === tagName);
    if (!tag) return;

    try {
      if (noteTags.includes(tagName)) {
        // Remove tag
        await supabase
          .from('note_tags')
          .delete()
          .eq('note_id', noteId)
          .eq('tag_id', tag.id);
      } else {
        // Add tag
        await supabase
          .from('note_tags')
          .insert([{ note_id: noteId, tag_id: tag.id }]);
      }

      loadNoteTags();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Tags
        </h3>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-3 h-3 mr-1" />
              New Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createTag()}
              />
              <Button onClick={createTag} className="w-full">
                Create Tag
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            variant={noteTags.includes(tag.name) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleTag(tag.name)}
          >
            {tag.name}
            {noteTags.includes(tag.name) && (
              <X className="w-3 h-3 ml-1" />
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default TagManager;
