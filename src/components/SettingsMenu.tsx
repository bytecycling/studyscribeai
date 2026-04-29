import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { logError } from "@/utils/logger";

interface SettingsMenuProps {
  onClearHistory: () => void;
}

const SettingsMenu = ({ onClearHistory }: SettingsMenuProps) => {
  const { t, i18n } = useTranslation();
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'english');
  const [tempLanguage, setTempLanguage] = useState(language);
  const [aiEnabled, setAiEnabled] = useState(localStorage.getItem('aiEnabled') !== 'false');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
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
    i18n.changeLanguage(tempLanguage);
    window.dispatchEvent(new CustomEvent("languagechange", { detail: { language: tempLanguage } }));
    toast({
      title: t("settings.languageUpdated"),
      description: t("settings.languageUpdatedDesc", { lang: tempLanguage }),
    });
    setShowLanguageDialog(false);
  };

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem('darkMode', enabled.toString());
    toast({
      title: enabled ? t("settings.darkOn") : t("settings.darkOff"),
      description: enabled ? t("settings.darkOnDesc") : t("settings.darkOffDesc"),
    });
  };

  const handleAiToggle = (enabled: boolean) => {
    setAiEnabled(enabled);
    localStorage.setItem('aiEnabled', enabled.toString());
    toast({
      title: enabled ? t("settings.aiOn") : t("settings.aiOff"),
      description: enabled ? t("settings.aiOnDesc") : t("settings.aiOffDesc"),
    });
  };

  const handleClearHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from('notes').delete().eq('user_id', user.id);
      if (error) throw error;

      toast({ title: t("settings.historyCleared"), description: t("settings.historyClearedDesc") });
      onClearHistory();
    } catch (error: any) {
      logError('SettingsMenu.clearHistory', error);
      toast({ title: t("common.error"), description: error.message || t("settings.failClear"), variant: "destructive" });
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
          <DropdownMenuLabel>{t("settings.title")}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleClearHistory}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("settings.clearHistory")}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">{t("settings.aiFeatures")}</span>
            </div>
            <Switch checked={aiEnabled} onCheckedChange={handleAiToggle} />
          </div>

          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span className="text-sm">{t("settings.darkMode")}</span>
            </div>
            <Switch checked={darkMode} onCheckedChange={handleDarkModeToggle} />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showLanguageDialog} onOpenChange={(open) => {
        setShowLanguageDialog(open);
        if (!open) setTempLanguage(language);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.chooseLanguage")}</DialogTitle>
            <DialogDescription>{t("settings.chooseLanguageDesc")}</DialogDescription>
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
              {t("settings.cancel")}
            </Button>
            <Button onClick={handleLanguageConfirm}>{t("settings.apply")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsMenu;
