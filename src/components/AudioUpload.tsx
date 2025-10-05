import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileAudio, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AudioUploadProps {
  onSuccess: () => void;
}

const AudioUpload = ({ onSuccess }: AudioUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: formData
      });

      if (error) throw error;

      // Generate full study pack
      const { data: pack, error: packError } = await supabase.functions.invoke('generate-study-pack', {
        body: { text: data.transcription || data.summary, title: `Audio: ${file.name}` }
      });
      if (packError) throw packError;

      // Save to database
      const user = (await supabase.auth.getUser()).data.user;
      const { error: insertError } = await supabase
        .from('notes')
        .insert({
          title: `Audio: ${file.name}`,
          content: pack?.notes || data.summary,
          highlights: pack?.highlights || null,
          flashcards: pack?.flashcards || null,
          quiz: pack?.quiz || null,
          raw_text: data.transcription || null,
          source_type: file.type.includes('video') ? 'video' : 'audio',
          user_id: user?.id
        });

      if (insertError) throw insertError;

      toast({
        title: "Success!",
        description: "File transcribed and saved to your notes",
      });

      setFile(null);
      onSuccess();

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process file",
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
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <FileAudio className="w-5 h-5 text-accent" />
          </div>
          <div>
            <CardTitle>Audio/Video Upload</CardTitle>
            <CardDescription>Upload MP3, MP4, or other media files</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="audio-file">Select File</Label>
            <Input
              id="audio-file"
              type="file"
              accept="audio/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isLoading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          <Button type="submit" disabled={isLoading || !file} className="w-full">
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

export default AudioUpload;
