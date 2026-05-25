import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

export interface RegenerationFeedback {
  presets: string[];
  instructions: string;
}

const PRESETS = [
  { id: "concise", label: "More concise" },
  { id: "summary", label: "Summarize heavily" },
  { id: "expand", label: "Expand detail" },
  { id: "simpler", label: "Simpler language" },
  { id: "examples", label: "More examples" },
  { id: "formulas", label: "Focus on formulas" },
  { id: "skip-history", label: "Skip background/history" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (feedback: RegenerationFeedback) => void;
}

export default function RegenerateDialog({ open, onOpenChange, onConfirm }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleConfirm = () => {
    onConfirm({ presets: selected, instructions: instructions.trim() });
    setSelected([]);
    setInstructions("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            How should the notes be improved?
          </DialogTitle>
          <DialogDescription>
            Pick quick options or describe what to change. All changes stay
            grounded in the original source — no outside info is added.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Quick options</div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const active = selected.includes(p.id);
                return (
                  <Badge
                    key={p.id}
                    variant={active ? "default" : "outline"}
                    onClick={() => toggle(p.id)}
                    className="cursor-pointer select-none"
                  >
                    {p.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              What should change? (optional)
            </label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={`e.g. "focus on chapter 2", "don't include the proofs", "shorter bullets in Main Notes"`}
              rows={4}
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {instructions.length}/1000 — must reference content already in the
              source.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate notes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
