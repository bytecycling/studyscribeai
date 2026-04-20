import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import NotesList from "@/components/NotesList";
import logoImage from "@/assets/studyscribe_logo.png";
import { useTranslation } from "react-i18next";

export default function History() {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-50 pointer-events-none" />

      <nav className="sticky top-3 z-40 mx-3 sm:mx-6">
        <div className="glass rounded-full px-4 sm:px-6 h-14 flex items-center justify-between shadow-soft max-w-6xl mx-auto">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logoImage} alt="StudyScribe.AI Logo" className="h-8 w-auto" />
            <span className="font-bold text-base sm:text-lg text-gradient animate-gradient">StudyScribe.AI</span>
          </Link>

          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t("common.backToDashboard")}</span>
              <span className="sm:hidden">{t("common.back")}</span>
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative container mx-auto px-4 py-12">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
            {t("history.titleA")} <span className="text-gradient animate-gradient">{t("history.titleB")}</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("history.subtitle")}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-6">
          <NotesList refreshTrigger={0} />
        </div>
      </main>
    </div>
  );
}
