import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import logoImage from "@/assets/studyscribe_logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || localStorage.getItem('darkMode') === null
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  return (
    <nav className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-6xl">
      <div className="glass rounded-full px-3 sm:px-6 h-14 flex items-center justify-between shadow-soft">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logoImage} alt="StudyScribe.AI Logo" className="h-8 w-auto" />
          <span className="font-bold text-base sm:text-lg hidden sm:inline">StudyScribe.AI</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-full h-9 w-9"
            aria-label={t("nav.toggleDark")}
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Link to="/auth" className="hidden sm:block">
            <Button variant="ghost" className="rounded-full h-9">{t("nav.signIn")}</Button>
          </Link>
          <Link to="/auth">
            <Button variant="default" className="rounded-full h-9 px-4 sm:px-5">{t("nav.getStarted")}</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

