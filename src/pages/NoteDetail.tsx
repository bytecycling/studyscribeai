import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Languages, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AiChat from "@/components/AiChat";
import RichTextEditor from "@/components/RichTextEditor";

interface NoteRow {
  id: string;
  title: string;
  content: string;
  source_type: string;
  source_url?: string | null;
  created_at: string;
  highlights?: any;
  flashcards?: any;
  quiz?: any;
}

export default function NoteDetail() {
  const { id } = useParams();
  const [note, setNote] = useState<NoteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const { toast } = useToast();

  const languages = [
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" },
    { value: "italian", label: "Italian" },
    { value: "portuguese", label: "Portuguese" },
    { value: "chinese", label: "Chinese" },
    { value: "japanese", label: "Japanese" },
    { value: "korean", label: "Korean" },
    { value: "arabic", label: "Arabic" },
    { value: "russian", label: "Russian" },
    { value: "hindi", label: "Hindi" },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) {
          setError("Missing note id");
          return;
        }
        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          setError("Note not found");
          return;
        }
        setNote(data as NoteRow);
      } catch (e: any) {
        console.error("load note error", e);
        setError(e.message || "Failed to load note");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (note?.title) {
      document.title = `${note.title} | Study Notes`;
    }
  }, [note]);

  const handleTranslate = async () => {
    if (!selectedLanguage || !note) return;

    setIsTranslating(true);
    setTranslatedContent(null);

    try {
      const { data, error } = await supabase.functions.invoke('translate-note', {
        body: {
          content: note.content,
          targetLanguage: languages.find(l => l.value === selectedLanguage)?.label || selectedLanguage
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setTranslatedContent(data.translatedContent);
      toast({
        title: "Success",
        description: `Translated to ${languages.find(l => l.value === selectedLanguage)?.label}`,
      });
    } catch (error: any) {
      console.error('Translation error:', error);
      toast({
        title: "Translation Error",
        description: error.message || "Failed to translate content",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const startEditing = () => {
    setEditedContent(note?.content || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedContent("");
  };

  const saveContent = async () => {
    if (!note || !editedContent.trim()) {
      toast({
        title: "Error",
        description: "Content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({ content: editedContent.trim() })
        .eq('id', note.id);

      if (error) throw error;

      setNote({ ...note, content: editedContent.trim() });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Note content updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note content",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-10">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (error || !note) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Link to="/dashboard"><Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4"/>Back</Button></Link>
        <Card className="mt-6"><CardContent className="py-10"><p className="text-destructive">{error || "Not found"}</p></CardContent></Card>
      </main>
    );
  }

  const highlights = Array.isArray(note.highlights) ? note.highlights : [];
  const flashcards = Array.isArray(note.flashcards) ? note.flashcards : [];
  const quiz = Array.isArray(note.quiz) ? note.quiz : [];

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{note.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(note.created_at).toLocaleString()} • {note.source_type}
          </p>
        </div>
        <Link to="/dashboard"><Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4"/>Back</Button></Link>
      </div>

      <Tabs defaultValue="notes">
        <TabsList className="grid w-full max-w-2xl grid-cols-6">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="ai">AI Chat</TabsTrigger>
          <TabsTrigger value="translate">Translate</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="notes">
            <Card>
              <CardContent className="py-6">
                <div className="flex justify-end mb-4 gap-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={saveContent}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={startEditing}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Note
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  <RichTextEditor
                    value={editedContent}
                    onChange={setEditedContent}
                  />
                ) : (
                  <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-4xl prose-h1:mb-6 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:my-4 prose-p:leading-relaxed prose-table:w-full prose-th:bg-muted prose-th:p-2 prose-th:border prose-td:p-2 prose-td:border">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {note.content}
                    </ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="highlights">
            <Card>
              <CardContent className="py-6">
                {highlights.length === 0 ? (
                  <p className="text-muted-foreground">No highlights generated.</p>
                ) : (
                  <ul className="list-disc pl-6 space-y-2">
                    {highlights.map((h: any, i: number) => (
                      <li key={i}>
                        <span className="font-medium">{h?.text || String(h)}</span>
                        {h?.why && <p className="text-sm text-muted-foreground">{h.why}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flashcards">
            <Card>
              <CardContent className="py-6 space-y-4">
                {flashcards.length === 0 ? (
                  <p className="text-muted-foreground">No flashcards generated.</p>
                ) : (
                  flashcards.map((fc: any, i: number) => (
                    <details key={i} className="group border rounded-md p-4">
                      <summary className="cursor-pointer font-medium">{fc?.question || `Card ${i+1}`}</summary>
                      <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{fc?.answer || ""}</div>
                    </details>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quiz">
            <Card>
              <CardContent className="py-6 space-y-6">
                {quiz.length === 0 ? (
                  <p className="text-muted-foreground">No quiz generated.</p>
                ) : (
                  quiz.map((q: any, i: number) => (
                    <div key={i} className="border rounded-md p-4">
                      <p className="font-medium mb-3">{q?.question || `Question ${i+1}`}</p>
                      <ol className="list-decimal pl-5 space-y-2">
                        {(q?.options || []).map((opt: string, oi: number) => (
                          <li key={oi} className={oi === q?.correctIndex ? "font-semibold" : undefined}>{opt}</li>
                        ))}
                      </ol>
                      {typeof q?.correctIndex === "number" && (
                        <p className="text-xs text-muted-foreground mt-2">Correct answer: Option {q.correctIndex + 1}</p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <AiChat noteId={id} noteContent={note.content} />
          </TabsContent>

          <TabsContent value="translate">
            <Card>
              <CardContent className="py-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Languages className="w-5 h-5 text-primary" />
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleTranslate} 
                    disabled={!selectedLanguage || isTranslating}
                  >
                    {isTranslating ? "Translating..." : "Translate"}
                  </Button>
                </div>

                {translatedContent && (
                  <div className="prose max-w-none dark:prose-invert mt-6">
                    <ReactMarkdown>{translatedContent}</ReactMarkdown>
                  </div>
                )}

                {!translatedContent && !isTranslating && (
                  <p className="text-muted-foreground text-center py-8">
                    Select a language and click translate to see your notes in another language
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
}
