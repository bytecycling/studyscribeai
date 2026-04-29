import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Folder, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FolderManagerProps {
  onFolderSelect: (folderId: string | null) => void;
  selectedFolderId: string | null;
}

const FolderManager = ({ onFolderSelect, selectedFolderId }: FolderManagerProps) => {
  const { t } = useTranslation();
  const [folders, setFolders] = useState<any[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (error: any) {
      console.error('Error loading folders:', error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('folders')
        .insert([{ name: newFolderName, user_id: user.id }]);

      if (error) throw error;

      toast({ title: t("folders.created"), description: t("folders.createdDesc", { name: newFolderName }) });
      setNewFolderName('');
      setShowDialog(false);
      loadFolders();
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      const { error } = await supabase.from('folders').delete().eq('id', folderId);
      if (error) throw error;

      toast({ title: t("folders.deleted") });
      if (selectedFolderId === folderId) {
        onFolderSelect(null);
      }
      loadFolders();
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Folder className="w-5 h-5" />
          {t("folders.title")}
        </h3>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              {t("folders.new")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("folders.create")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder={t("folders.name")}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createFolder()}
              />
              <Button onClick={createFolder} className="w-full">
                {t("folders.createBtn")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <div onDragOver={handleDragOver}>
          <Button
            variant={selectedFolderId === null ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => onFolderSelect(null)}
          >
            <Folder className="w-4 h-4 mr-2" />
            {t("folders.allNotes")}
          </Button>
        </div>

        {folders.map((folder) => (
          <div key={folder.id} className="flex items-center gap-2" onDragOver={handleDragOver}>
            <Button
              variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
              className="flex-1 justify-start"
              onClick={() => onFolderSelect(folder.id)}
            >
              <Folder className="w-4 h-4 mr-2" style={{ color: folder.color }} />
              {folder.name}
            </Button>
            <Button size="icon" variant="ghost" onClick={() => deleteFolder(folder.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FolderManager;
