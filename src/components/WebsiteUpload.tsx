import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import GeneratingLoader from "./GeneratingLoader";

interface WebsiteUploadProps {
  onSuccess: () => void;
}

// Check if notes are complete
function isNotesComplete(content: string): boolean {
  if (!content) return false;
  const lowerContent = content.toLowerCase();
  return (
    lowerContent.includes("## 📝 summary") ||
    lowerContent.includes("## summary") ||
    lowerContent.includes("## 🎓 next steps") ||
    lowerContent.includes("## next steps") ||
    lowerContent.includes("end_of_notes")
  );
}

const WebsiteUpload = ({ onSuccess }: WebsiteUploadProps) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a website URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(10);
    setStatusText("Scraping website...");

    try {
      setProgress(25);
      
      // Call the edge function to scrape website
      const { data, error } = await supabase.functions.invoke('scrape-website', {
        body: { url }
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      setProgress(40);
      setStatusText("Generating notes...");

      const extractedText = (data as any)?.content || (data as any)?.text;
      if (!extractedText) throw new Error('No content could be extracted from this website.');

      const pageTitle = (data as any)?.title || new URL(url).hostname;

      // Generate full study pack
      const { data: pack, error: packError } = await supabase.functions.invoke('generate-study-pack', {
        body: { text: extractedText, title: pageTitle }
      });
      
      if (packError) throw packError;
      if ((pack as any)?.error) throw new Error((pack as any).error);

      setProgress(70);

      let finalNotes = (pack as any)?.notes || extractedText;

      // Auto-continue if notes are incomplete
      if (!isNotesComplete(finalNotes)) {
        setStatusText("Completing notes...");
        
        const { data: contData, error: contError } = await supabase.functions.invoke('continue-notes', {
          body: { currentNotes: finalNotes, rawText: extractedText, title: pageTitle }
        });
        
        if (!contError && !(contData as any)?.error) {
          finalNotes = (contData as any)?.notes || finalNotes;
        }
      }

      setProgress(90);
      setStatusText("Saving...");

      // Save to database
      const user = (await supabase.auth.getUser()).data.user;
      const { error: insertError } = await supabase
        .from('notes')
        .insert({
          title: pageTitle,
          content: finalNotes,
          highlights: (pack as any)?.highlights || null,
          flashcards: (pack as any)?.flashcards || null,
          quiz: (pack as any)?.quiz || null,
          raw_text: extractedText,
          source_type: 'website',
          source_url: url,
          user_id: user?.id,
        } as any);

      if (insertError) throw insertError;

      setProgress(100);

      toast({
        title: "Success!",
        description: "Website content saved to your notes",
      });

      setUrl("");
      onSuccess();

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process website",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
      setStatusText("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-accent" />
          </div>
          <div>
            <CardTitle>Website Scraper</CardTitle>
            <CardDescription>Extract content from articles and web pages</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && progress > 0 ? (
          <GeneratingLoader progress={progress} title={url} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website-url">Website URL</Label>
              <Input
                id="website-url"
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Works best with articles, Wikipedia pages, and public content. Does not work with login-required sites.
              </p>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              Generate Notes
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default WebsiteUpload;
