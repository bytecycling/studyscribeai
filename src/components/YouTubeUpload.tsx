import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface YouTubeUploadProps {
  onSuccess: () => void;
}

const YouTubeUpload = ({ onSuccess }: YouTubeUploadProps) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(10);

    try {
      setProgress(30);
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('youtube-transcribe', {
        body: { youtubeUrl: url }
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const inputText = (data as any)?.transcript || (data as any)?.summary;
      if (!inputText) throw new Error('No transcript found for this video. It may not have captions.');

      setProgress(60);

      // Extract video title
      const videoTitle = (data as any)?.title || `Video ${(data as any)?.videoId || ''}`;

      // Generate full study pack
      const { data: pack, error: packError } = await supabase.functions.invoke('generate-study-pack', {
        body: { text: inputText, title: videoTitle }
      });
      if (packError) throw packError;
      if ((pack as any)?.error) throw new Error((pack as any).error);

      setProgress(90);

      // Save to database
      const user = (await supabase.auth.getUser()).data.user;
      const { error: insertError } = await supabase
        .from('notes')
        .insert({
          title: videoTitle,
          content: pack?.notes || data.summary,
          highlights: pack?.highlights || null,
          flashcards: pack?.flashcards || null,
          quiz: pack?.quiz || null,
          raw_text: data.transcript || null,
          source_type: 'youtube',
          source_url: url,
          user_id: user?.id
        });

      if (insertError) throw insertError;

      setProgress(100);

      toast({
        title: "Success!",
        description: "YouTube video transcribed and saved to your notes",
      });

      setUrl("");
      onSuccess();

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process video",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Youtube className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>YouTube Transcription</CardTitle>
            <CardDescription>Paste a YouTube URL to generate study notes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-url">YouTube URL</Label>
            <Input
              id="youtube-url"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {isLoading && progress > 0 && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-center text-muted-foreground">
                Processing video... {progress}%
              </p>
            </div>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Generate Notes"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default YouTubeUpload;
