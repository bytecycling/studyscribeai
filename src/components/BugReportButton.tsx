import { useState } from "react";
import { Bug, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BugReportButtonProps {
  noteId?: string;
  noteTitle?: string;
}

const issueTypes = [
  { value: "bug", label: "🐛 Bug / Error" },
  { value: "lag", label: "🐢 Lag / Slow Performance" },
  { value: "crash", label: "💥 Crash / Freeze" },
  { value: "display", label: "🖥️ Display Issue" },
  { value: "feature", label: "💡 Feature Request" },
  { value: "other", label: "📝 Other" },
];

export default function BugReportButton({ noteId, noteTitle }: BugReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!issueType) {
      toast({
        title: "Missing Information",
        description: "Please select an issue type",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe the issue",
        variant: "destructive",
      });
      return;
    }

    if (description.length > 5000) {
      toast({
        title: "Description Too Long",
        description: "Please keep description under 5000 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const browserInfo = `${navigator.userAgent} | Screen: ${window.innerWidth}x${window.innerHeight} | URL: ${window.location.href}`;
      
      const { data, error } = await supabase.functions.invoke("report-bug", {
        body: {
          noteId,
          noteTitle,
          issueType: issueTypes.find(t => t.value === issueType)?.label || issueType,
          description: description.trim(),
          userEmail: userEmail.trim() || undefined,
          browserInfo,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Report Sent! 🎉",
        description: "Thank you for your feedback. We'll look into it!",
      });

      // Reset form
      setIssueType("");
      setDescription("");
      setUserEmail("");
      setOpen(false);
    } catch (error: any) {
      console.error("Bug report error:", error);
      toast({
        title: "Failed to Send",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bug className="h-4 w-4" />
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" />
            Report an Issue
          </DialogTitle>
          <DialogDescription>
            Found a bug, lag, or error? Let us know and we'll fix it!
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="issue-type">Issue Type *</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger id="issue-type">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what happened, what you expected, and steps to reproduce..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/5000
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Your Email (optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="For follow-up if needed"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
