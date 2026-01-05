import { Loader2, BookOpen, Sparkles, Brain, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

interface GeneratingLoaderProps {
  progress: number;
  title?: string;
}

const stages = [
  { icon: FileText, text: "Extracting content...", min: 0, max: 30 },
  { icon: Brain, text: "Analyzing material...", min: 30, max: 60 },
  { icon: Sparkles, text: "Generating notes...", min: 60, max: 85 },
  { icon: BookOpen, text: "Creating study materials...", min: 85, max: 100 },
];

export default function GeneratingLoader({ progress, title }: GeneratingLoaderProps) {
  const [dots, setDots] = useState("");

  // Animate dots to show activity
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const currentStage = stages.find(s => progress >= s.min && progress < s.max) || stages[stages.length - 1];
  const StageIcon = currentStage.icon;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 space-y-6">
      {/* Animated Icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <StageIcon className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <div className="absolute -top-1 -right-1">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
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
          {currentStage.text}{dots}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          This may take a moment
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-center text-muted-foreground">
          {progress}% complete
        </p>
      </div>

      {/* Activity Indicator */}
      <div className="flex gap-1 mt-2">
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse [animation-delay:200ms]" />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse [animation-delay:400ms]" />
      </div>
    </div>
  );
}
