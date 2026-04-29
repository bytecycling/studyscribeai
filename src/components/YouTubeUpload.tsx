import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import GeneratingLoader from "./GeneratingLoader";
import { useProcessingLogs } from "@/hooks/useProcessingLogs";

interface YouTubeUploadProps {
  onSuccess: () => void;
}

const YouTubeUpload = ({ onSuccess }: YouTubeUploadProps) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
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
    if (!url) {
      toast({ title: t("common.error"), description: t("upload.enterYoutube"), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setProgress(10);
    reset();

    try {
      pushLog(t("loader.fetchingTranscript"));
      setProgress(25);

      const { data, error } = await supabase.functions.invoke('youtube-transcribe', { body: { youtubeUrl: url } });
      if (isCancelled()) return;
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const inputText = (data as any)?.transcript || (data as any)?.summary;
      if (!inputText) throw new Error('No transcript found for this video. It may not have captions.');

      const videoTitleFallback = (data as any)?.title || `Video ${(data as any)?.videoId || ''}`;
      setProgress(45);
      pushLog(t("loader.callingAi"));

      const { data: pack, error: packError } = await supabase.functions.invoke('generate-study-pack', {
        body: { text: inputText, title: videoTitleFallback }
      });
      if (isCancelled()) return;
      if (packError) throw packError;
      if ((pack as any)?.error) throw new Error((pack as any).error);

      const isComplete = Boolean((pack as any)?.isComplete);
      const activityLog = (pack as any)?.activityLog || [];
      if (!isComplete) throw new Error(t("upload.incomplete"));

      const finalTitle = (pack as any)?.suggestedTitle || videoTitleFallback;
      setProgress(90);
      pushLog(t("loader.saving"));

      const user = (await supabase.auth.getUser()).data.user;
      const { error: insertError } = await supabase.from('notes').insert({
        title: finalTitle,
        content: (pack as any)?.notes || inputText,
        highlights: (pack as any)?.highlights || null,
        flashcards: (pack as any)?.flashcards || null,
        quiz: (pack as any)?.quiz || null,
        raw_text: inputText,
        source_type: 'youtube',
        source_url: url,
        user_id: user?.id,
        is_complete: true,
        activity_log: activityLog as any,
      } as any);
      if (insertError) throw insertError;

      finishAll();
      setProgress(100);
      toast({ title: t("upload.success"), description: t("upload.youtubeOk") });
      setUrl("");
      onSuccess();
    } catch (error: any) {
      if (error?.message === "__cancelled__" || isCancelled()) return;
      console.error('Error:', error);
      toast({ title: t("common.error"), description: error.message || t("upload.failYt"), variant: "destructive" });
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
            <CardTitle>{t("upload.youtubeTitle")}</CardTitle>
            <CardDescription>{t("upload.youtubeDesc")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && progress > 0 ? (
          <GeneratingLoader progress={progress} title={url} logs={logs} onCancel={handleCancel} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">{t("upload.youtubeUrl")}</Label>
              <Input id="youtube-url" type="url" placeholder={t("upload.youtubePh")} value={url} onChange={(e) => setUrl(e.target.value)} disabled={isLoading} />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">{t("upload.generate")}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default YouTubeUpload;
