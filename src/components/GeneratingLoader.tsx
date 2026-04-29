import { Loader2, BookOpen, Sparkles, Brain, FileText, X, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppleBookLoader from "@/components/AppleBookLoader";

export interface ProcessingLog {
  ts: number;
  message: string;
  done?: boolean;
}

interface GeneratingLoaderProps {
  progress: number;
  title?: string;
  logs?: ProcessingLog[];
  onCancel?: () => void;
}

const stages = [
  { icon: FileText, key: "extracting", min: 0, max: 30 },
  { icon: Brain, key: "analyzing", min: 30, max: 60 },
  { icon: Sparkles, key: "generating", min: 60, max: 85 },
  { icon: BookOpen, key: "creating", min: 85, max: 100 },
] as const;

export default function GeneratingLoader({ progress, title, logs = [], onCancel }: GeneratingLoaderProps) {
  const { t } = useTranslation();
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const currentStage = stages.find(s => progress >= s.min && progress < s.max) || stages[stages.length - 1];
  const StageIcon = currentStage.icon;

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 space-y-5">
      {/* Apple → Book → Book loop animation */}
      <AppleBookLoader />

      {/* Subtle stage chip under the animation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <StageIcon className="w-3.5 h-3.5 text-primary" />
        <span>{t(`loader.${currentStage.key}`)}{dots}</span>
      </div>

      {/* Title */}
      {title && (
        <p className="text-sm text-muted-foreground text-center max-w-xs truncate">
          {title}
        </p>
      )}

      {/* Stage Text */}
      <div className="text-center">
        <p className="font-medium text-foreground">
          {t(`loader.${currentStage.key}`)}{dots}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t("loader.moment")}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-sm space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-center text-muted-foreground">
          {t("loader.percent", { p: Math.round(progress) })}
        </p>
      </div>

      {/* Activity log */}
      {logs.length > 0 && (
        <div className="w-full max-w-sm rounded-lg border border-border/50 bg-muted/30 p-3 max-h-40 overflow-y-auto text-xs space-y-1.5">
          <p className="font-medium text-muted-foreground mb-1">{t("loader.activityLog")}</p>
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-2 animate-fade-in">
              {log.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin mt-0.5 flex-shrink-0" />
              )}
              <span className="text-foreground/80">{log.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Activity Indicator */}
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse [animation-delay:200ms]" />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse [animation-delay:400ms]" />
      </div>

      {/* Cancel button */}
      {onCancel && (
        <Button variant="outline" size="sm" onClick={onCancel} className="mt-2">
          <X className="w-4 h-4 mr-2" />
          {t("loader.cancel")}
        </Button>
      )}
    </div>
  );
}
