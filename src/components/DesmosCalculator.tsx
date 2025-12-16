import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, X, Maximize2, Minimize2 } from "lucide-react";

declare global {
  interface Window {
    Desmos: any;
  }
}

interface DesmosCalculatorProps {
  onClose?: () => void;
}

export default function DesmosCalculator({ onClose }: DesmosCalculatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load Desmos script
    const script = document.createElement("script");
    script.src = "https://www.desmos.com/api/v1.11/calculator.js?apiKey=452753a0558f4a3c97f286efa8700052";
    script.async = true;
    script.onload = () => {
      setIsLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      if (calculatorRef.current) {
        calculatorRef.current.destroy();
      }
      // Clean up script if needed
    };
  }, []);

  useEffect(() => {
    if (isLoaded && containerRef.current && window.Desmos) {
      calculatorRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
        expressions: true,
        settingsMenu: true,
        zoomButtons: true,
        expressionsTopbar: true,
        pointsOfInterest: true,
        trace: true,
        border: false,
        lockViewport: false,
        expressionsCollapsed: false,
      });
    }
  }, [isLoaded]);

  return (
    <div className={`bg-background border border-border rounded-lg overflow-hidden shadow-lg ${
      isExpanded ? "fixed inset-4 z-50" : "w-full"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Desmos Calculator</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Calculator Container */}
      <div
        ref={containerRef}
        className={isExpanded ? "h-[calc(100%-40px)]" : "h-[400px]"}
        style={{ width: "100%" }}
      >
        {!isLoaded && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading calculator...
          </div>
        )}
      </div>
    </div>
  );
}
