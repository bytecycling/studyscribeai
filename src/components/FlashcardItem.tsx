import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";

interface FlashcardItemProps {
  question: string;
  answer: string;
  index: number;
}

export default function FlashcardItem({ question, answer, index }: FlashcardItemProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={cn(
          "relative w-full min-h-[140px] transition-transform duration-500 transform-style-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front - Question */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rounded-lg border border-border p-4 bg-card",
            "flex flex-col justify-center"
          )}
        >
          <div className="text-xs text-muted-foreground mb-2 font-medium">
            Card {index + 1} • Click to flip
          </div>
          <div className="text-foreground">
            <span className="text-primary font-bold">Question: </span>
            <span className="prose prose-sm dark:prose-invert inline prose-p:my-0 prose-p:leading-snug">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => <span>{children}</span>,
                }}
              >
                {question}
              </ReactMarkdown>
            </span>
          </div>
        </div>

        {/* Back - Answer */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rounded-lg border border-primary/50 p-4 bg-primary/5",
            "flex flex-col justify-center rotate-y-180"
          )}
        >
          <div className="text-xs text-muted-foreground mb-2 font-medium">
            Answer • Click to flip back
          </div>
          <div className="text-foreground">
            <span className="text-primary font-bold">Answer: </span>
            <span className="prose prose-sm dark:prose-invert inline prose-p:my-0 prose-p:leading-snug">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => <span>{children}</span>,
                }}
              >
                {answer}
              </ReactMarkdown>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
