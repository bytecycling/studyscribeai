import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Languages, Trash2, Sparkles, Moon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface SettingsMenuProps {
  onClearHistory: () => void;
}

const SettingsMenu = ({ onClearHistory }: SettingsMenuProps) => {
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [language, setLanguage] = useState(
    localStorage.getItem('language') || 'english'
  );
  const [tempLanguage, setTempLanguage] = useState(language);
  const [aiEnabled, setAiEnabled] = useState(
    localStorage.getItem('aiEnabled') !== 'false'
  );
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  );
  const { toast } = useToast();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLanguageConfirm = () => {
    setLanguage(tempLanguage);
    localStorage.setItem('language', tempLanguage);
    toast({
      title: "Language updated",
      description: `Language preference set to ${tempLanguage}`,
    });
    setShowLanguageDialog(false);
    // Reload to apply language changes
    window.location.reload();
  };

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem('darkMode', enabled.toString());
    toast({
      title: enabled ? "Dark mode enabled" : "Dark mode disabled",
      description: enabled 
        ? "Dark mode is now active" 
        : "Dark mode has been disabled",
    });
  };

  const handleAiToggle = (enabled: boolean) => {
    setAiEnabled(enabled);
    localStorage.setItem('aiEnabled', enabled.toString());
    toast({
      title: enabled ? "AI enabled" : "AI disabled",
      description: enabled 
        ? "AI features are now active" 
        : "AI features have been disabled",
    });
  };

  const handleClearHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "History cleared",
        description: "All your notes have been deleted",
      });

      onClearHistory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear history",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowLanguageDialog(true)}>
            <Languages className="mr-2 h-4 w-4" />
            Change Language
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleClearHistory}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">AI Features</span>
            </div>
            <Switch
              checked={aiEnabled}
              onCheckedChange={handleAiToggle}
            />
          </div>

          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span className="text-sm">Dark Mode</span>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showLanguageDialog} onOpenChange={(open) => {
        setShowLanguageDialog(open);
        if (!open) setTempLanguage(language);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Language</DialogTitle>
            <DialogDescription>
              Select your preferred language for the interface
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={tempLanguage} onValueChange={setTempLanguage}>
            {['English', 'Español', 'Français', '中文', '日本語', 'Bahasa Melayu'].map((lang) => (
              <div key={lang} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value={lang.toLowerCase()} id={`lang-${lang}`} />
                <Label htmlFor={`lang-${lang}`} className="flex-1 cursor-pointer">{lang}</Label>
              </div>
            ))}
          </RadioGroup>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowLanguageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLanguageConfirm}>
              Apply Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsMenu;
