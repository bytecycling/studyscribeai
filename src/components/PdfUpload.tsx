import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PdfUploadProps {
  onSuccess: () => void;
}

const PdfUpload = ({ onSuccess }: PdfUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('process-pdf', {
        body: formData
      });

      if (error) throw error;

      // Save to database
      const { error: insertError } = await supabase
        .from('notes')
        .insert({
          title: `PDF: ${file.name}`,
          content: data.summary,
          source_type: 'pdf',
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (insertError) throw insertError;

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

export default PdfUpload;
