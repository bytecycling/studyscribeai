import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileAudio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import GeneratingLoader from "./GeneratingLoader";
import { useProcessingLogs } from "@/hooks/useProcessingLogs";

interface AudioUploadProps {
  onSuccess: () => void;
}

const AudioUpload = ({ onSuccess }: AudioUploadProps) => {
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
      toast({ title: t("common.error"), description: t("upload.selectFile"), variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: t("common.error"), description: t("upload.audioOver"), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setProgress(10);
    reset();

    try {
      const formData = new FormData();
      formData.append('file', file);
      pushLog(t("loader.transcribing"));
      setProgress(25);

      const { data, error } = await supabase.functions.invoke('transcribe-audio', { body: formData });
      if (isCancelled()) return;
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const transcriptText = (data as any)?.transcript || (data as any)?.summary;
      if (!transcriptText) throw new Error('No transcription returned. Please try another file.');

      setProgress(50);
      pushLog(t("loader.callingAi"));

      const audioTitleFallback = file.name.replace(/\.[^/.]+$/, "");

      const { data: pack, error: packError } = await supabase.functions.invoke('generate-study-pack', {
        body: { text: transcriptText, title: audioTitleFallback }
      });
      if (isCancelled()) return;
      if (packError) throw packError;
      if ((pack as any)?.error) throw new Error((pack as any).error);

      const isComplete = Boolean((pack as any)?.isComplete);
      const activityLog = (pack as any)?.activityLog || [];
      if (!isComplete) throw new Error(t("upload.incomplete"));

      const finalTitle = (pack as any)?.suggestedTitle || audioTitleFallback;
      setProgress(90);
      pushLog(t("loader.saving"));

      const user = (await supabase.auth.getUser()).data.user;
      const { error: insertError } = await supabase.from('notes').insert({
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

      finishAll();
      setProgress(100);
      toast({ title: t("upload.success"), description: t("upload.audioOk") });
      setFile(null);
      onSuccess();
    } catch (error: any) {
      if (error?.message === "__cancelled__" || isCancelled()) return;
      console.error('Error:', error);
      toast({ title: t("common.error"), description: error.message || t("upload.failAudio"), variant: "destructive" });
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
            <CardTitle>{t("upload.audioTitle")}</CardTitle>
            <CardDescription>{t("upload.audioDesc")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && progress > 0 ? (
          <GeneratingLoader progress={progress} title={file?.name || "Audio"} logs={logs} onCancel={handleCancel} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="audio-file">{t("upload.audioSelect")}</Label>
              <Input id="audio-file" type="file" accept="audio/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={isLoading} />
              {file && (
                <p className="text-sm text-muted-foreground">
                  {t("upload.audioSelected")}: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  {file.size > 20 * 1024 * 1024 && (
                    <span className="text-destructive font-medium"> - {t("upload.audioOver")}!</span>
                  )}
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

export default AudioUpload;
