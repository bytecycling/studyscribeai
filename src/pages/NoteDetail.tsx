import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="notes">
            <Card>
              <CardContent className="prose max-w-none dark:prose-invert py-6">
                <ReactMarkdown>{note.content}</ReactMarkdown>
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
        </div>
      </Tabs>
    </main>
  );
}
