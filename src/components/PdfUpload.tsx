import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import GeneratingLoader from "./GeneratingLoader";
import { useProcessingLogs } from "@/hooks/useProcessingLogs";

interface PdfUploadProps {
  onSuccess: () => void;
}

const PdfUpload = ({ onSuccess }: PdfUploadProps) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { logs, pushLog, finishAll, reset, cancel, isCancelled } = useProcessingLogs();

  const handleCancel = () => {
    cancel();
    setIsLoading(false);
    setProgress(0);
    toast({ title: t("upload.cancelled"), description: t("upload.cancelledDesc") });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: t("common.error"), description: t("upload.selectPdf"), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setProgress(10);
    reset();

    try {
      const formData = new FormData();
      formData.append('file', file);
      pushLog(t("loader.parsingPdf"));
      setProgress(30);

      const { data, error } = await supabase.functions.invoke('process-pdf', { body: formData });
      if (isCancelled()) return;
      if (error) throw error;
      setProgress(60);

      const pdfTitleFallback = file.name.replace(/\.[^/.]+$/, "");
      const pdfContent = (data as any)?.content || (data as any)?.summary;

      pushLog(t("loader.callingAi"));
      const { data: pack, error: packError } = await supabase.functions.invoke('generate-study-pack', {
        body: { text: pdfContent, title: pdfTitleFallback }
      });
      if (isCancelled()) return;
      if (packError) throw packError;
      if ((pack as any)?.error) throw new Error((pack as any).error);

      const isComplete = Boolean((pack as any)?.isComplete);
      const activityLog = (pack as any)?.activityLog || [];
      if (!isComplete) throw new Error(t("upload.incomplete"));

      const finalTitle = (pack as any)?.suggestedTitle || pdfTitleFallback;
      setProgress(90);
      pushLog(t("loader.saving"));

      const user = (await supabase.auth.getUser()).data.user;
      const { error: insertError } = await supabase.from('notes').insert({
        title: finalTitle,
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

      finishAll();
      setProgress(100);
      toast({ title: t("upload.success"), description: t("upload.pdfOk") });
      setFile(null);
      onSuccess();
    } catch (error: any) {
      if (error?.message === "__cancelled__" || isCancelled()) return;
      console.error('Error:', error);
      toast({ title: t("common.error"), description: error.message || t("upload.failPdf"), variant: "destructive" });
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
            <CardTitle>{t("upload.pdfTitle")}</CardTitle>
            <CardDescription>{t("upload.pdfDesc")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && progress > 0 ? (
          <GeneratingLoader progress={progress} title={file?.name || "PDF"} logs={logs} onCancel={handleCancel} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-file">{t("upload.pdfSelect")}</Label>
              <Input id="pdf-file" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={isLoading} />
              {file && (
                <p className="text-sm text-muted-foreground">
                  {t("upload.audioSelected")}: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <Button type="submit" disabled={isLoading || !file} className="w-full">{t("upload.generate")}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default PdfUpload;
