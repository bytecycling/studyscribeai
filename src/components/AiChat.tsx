import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Brain, Loader2, Send, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

interface AiChatProps {
  noteId?: string;
  noteContent?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AiChat = ({ noteId }: AiChatProps) => {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const { toast } = useToast();

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!noteId) return;

      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("note_id", noteId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data) {
          setMessages(
            data.map((msg) => ({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            }))
          );
        }
      } catch (error: any) {
        console.error("Error loading chat history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [noteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);

    // Add typing indicator
    const typingMessage: Message = { role: "assistant", content: "..." };
    setMessages((prev) => [...prev, typingMessage]);

    const submittedQuestion = question;
    setQuestion("");

    try {
      // Save user message to database
      if (noteId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("chat_messages").insert({
            user_id: user.id,
            note_id: noteId,
            role: "user",
            content: submittedQuestion,
          });
        }
      }

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { question: submittedQuestion, conversationHistory: messages, noteId },
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const assistantMessage: Message = {
        role: "assistant",
        content: (data as any)?.answer || "I couldn't generate a response.",
      };

      // Remove typing indicator and add real response
      setMessages((prev) => [...prev.slice(0, -1), assistantMessage]);

      // Save assistant message to database
      if (noteId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("chat_messages").insert({
            user_id: user.id,
            note_id: noteId,
            role: "assistant",
            content: assistantMessage.content,
          });
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      // Remove typing indicator on error
      setMessages((prev) => prev.slice(0, -2));
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (!noteId) return;

    try {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("note_id", noteId);

      if (error) throw error;

      setMessages([]);
      toast({
        title: "Success",
        description: "Chat history cleared",
      });
    } catch (error: any) {
      console.error("Error clearing chat:", error);
      toast({
        title: "Error",
        description: "Failed to clear chat history",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>AI Chat</CardTitle>
              <CardDescription>Ask me to explain, clarify, or go deeper</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[420px] w-full border rounded-md p-4">
          {loadingHistory ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Loading chat history...
            </p>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-muted-foreground text-sm">
                {noteId
                  ? "Ask me anything about this study note!"
                  : "Ask me anything about your study notes!"}
              </p>
              <p className="text-xs text-muted-foreground">
                I can explain further, break things down step-by-step, or clarify concepts
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Ask me anything..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading || loadingHistory}
          />
          <Button type="submit" disabled={isLoading} size="icon" aria-label="Send message">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AiChat;

