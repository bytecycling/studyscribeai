import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileAudio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import GeneratingLoader from "./GeneratingLoader";

interface AudioUploadProps {
  onSuccess: () => void;
}

const AudioUpload = ({ onSuccess }: AudioUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
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

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File exceeds 20MB limit",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(10);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      setProgress(25);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: formData
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const transcriptText = (data as any)?.transcript || (data as any)?.summary;
      if (!transcriptText) throw new Error('No transcription returned. Please try another file.');

      setProgress(50);

      const audioTitleFallback = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension

      // Generate full study pack
      const { data: pack, error: packError } = await supabase.functions.invoke('generate-study-pack', {
        body: { text: transcriptText, title: audioTitleFallback }
      });
      if (packError) throw packError;
      if ((pack as any)?.error) throw new Error((pack as any).error);

      // Check if generation was complete
      const isComplete = Boolean((pack as any)?.isComplete);
      const activityLog = (pack as any)?.activityLog || [];

      if (!isComplete) {
        // If not complete, throw an error - don't save incomplete notes
        throw new Error("Notes generation was incomplete. Please try again.");
      }

      // Use AI-generated title if available
      const finalTitle = (pack as any)?.suggestedTitle || audioTitleFallback;

      setProgress(90);

      // Save to database
      const user = (await supabase.auth.getUser()).data.user;
      const { error: insertError } = await supabase
        .from('notes')
        .insert({
          title: finalTitle,
          content: (pack as any)?.notes || transcriptText,
          highlights: (pack as any)?.highlights || null,
          flashcards: (pack as any)?.flashcards || null,
          quiz: (pack as any)?.quiz || null,
          raw_text: transcriptText,
          source_type: file.type.includes('video') ? 'video' : 'audio',
          user_id: user?.id,
          is_complete: true,
          activity_log: activityLog as any,
        } as any);

      if (insertError) throw insertError;

      setProgress(100);

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
      setProgress(0);
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
        {isLoading && progress > 0 ? (
          <GeneratingLoader progress={progress} title={file?.name || "Audio"} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="audio-file">Select File (Max 20MB)</Label>
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
                  {file.size > 20 * 1024 * 1024 && (
                    <span className="text-destructive font-medium"> - File exceeds 20MB limit!</span>
                  )}
                </p>
              )}
            </div>
            <Button type="submit" disabled={isLoading || !file} className="w-full">
              Generate Notes
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioUpload;
