import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import GeneratingLoader from "./GeneratingLoader";

interface PdfUploadProps {
  onSuccess: () => void;
}

const PdfUpload = ({ onSuccess }: PdfUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a PDF file",
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

      setProgress(30);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('process-pdf', {
        body: formData
      });

      if (error) throw error;

      setProgress(60);

      const pdfTitle = `PDF: ${file.name}`;
      const pdfContent = (data as any)?.content || (data as any)?.summary;

      // Generate full study pack
      const { data: pack, error: packError } = await supabase.functions.invoke('generate-study-pack', {
        body: { text: pdfContent, title: pdfTitle }
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

      setProgress(90);

      // Save to database
      const user = (await supabase.auth.getUser()).data.user;
      const { error: insertError } = await supabase
        .from('notes')
        .insert({
          title: pdfTitle,
          content: (pack as any)?.notes || pdfContent,
          highlights: (pack as any)?.highlights || null,
          flashcards: (pack as any)?.flashcards || null,
          quiz: (pack as any)?.quiz || null,
          raw_text: pdfContent,
          source_type: 'pdf',
          user_id: user?.id,
          is_complete: true,
          activity_log: activityLog as any,
        } as any);

      if (insertError) throw insertError;

      setProgress(100);

      toast({
        title: "Success!",
        description: "PDF processed and saved to your notes",
      });

      setFile(null);
      onSuccess();

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process PDF",
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
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>PDF Upload</CardTitle>
            <CardDescription>Upload PDF documents for analysis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && progress > 0 ? (
          <GeneratingLoader progress={progress} title={file?.name || "PDF"} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-file">Select PDF</Label>
              <Input
                id="pdf-file"
                type="file"
                accept=".pdf"
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
              Generate Notes
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default PdfUpload;
