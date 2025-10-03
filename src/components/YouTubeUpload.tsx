import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface YouTubeUploadProps {
  onSuccess: () => void;
}

const YouTubeUpload = ({ onSuccess }: YouTubeUploadProps) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

    try {
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('youtube-transcribe', {
        body: { youtubeUrl: url }
      });

      if (error) throw error;

      // Save to database
      const { error: insertError } = await supabase
        .from('notes')
        .insert({
          title: `YouTube: ${data.videoId}`,
          content: data.summary,
          source_type: 'youtube',
          source_url: url,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (insertError) throw insertError;

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
