import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// key matches i18n resource keys + localStorage 'language'
export const LANGUAGES = [
  { key: "english", label: "English", sublabel: "English" },
  { key: "español", label: "Español", sublabel: "Spanish" },
  { key: "français", label: "Français", sublabel: "French" },
  { key: "中文", label: "中文（简体）", sublabel: "Chinese Simplified" },
  { key: "日本語", label: "日本語", sublabel: "Japanese" },
  { key: "bahasa melayu", label: "Bahasa Melayu", sublabel: "Malay" },
];

interface LanguageSwitcherProps {
  variant?: "ghost" | "outline";
  compact?: boolean;
}

const LanguageSwitcher = ({ variant = "ghost", compact = false }: LanguageSwitcherProps) => {
  const { i18n, t } = useTranslation();
  const [current, setCurrent] = useState<string>(
    () => localStorage.getItem("language") || i18n.language || "english"
  );

  useEffect(() => {
    const stored = localStorage.getItem("language");
    if (stored && stored !== i18n.language) {
      i18n.changeLanguage(stored);
      setCurrent(stored);
    }
  }, [i18n]);

  const activeLang = LANGUAGES.find((l) => l.key === current) ?? LANGUAGES[0];

  const handleSelect = (key: string) => {
    if (key === current) return;
    localStorage.setItem("language", key);
    setCurrent(key);
    i18n.changeLanguage(key);
    // Live update — no reload needed; broadcast for any non-react listeners
    window.dispatchEvent(new CustomEvent("languagechange", { detail: { language: key } }));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={compact ? "icon" : "sm"}
          className={compact ? "rounded-full h-9 w-9" : "rounded-full h-9 px-3 gap-1.5"}
          aria-label={t("nav.changeLanguage")}
        >
          <Languages className="h-4 w-4" />
          {!compact && (
            <span className="text-xs font-medium hidden sm:inline">
              {activeLang.label}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass-card">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t("nav.chooseLanguage")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((lang) => {
          const isActive = lang.key === current;
          return (
            <DropdownMenuItem
              key={lang.key}
              onClick={() => handleSelect(lang.key)}
              className="cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{lang.label}</span>
                <span className="text-[11px] text-muted-foreground">
                  {lang.sublabel}
                </span>
              </div>
              {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
