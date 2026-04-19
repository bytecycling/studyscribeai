import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "How does StudyScribe.AI work?",
      answer: "StudyScribe.AI uses advanced AI to analyze your learning materials (YouTube videos, PDFs, audio files, or websites) and automatically generates comprehensive study notes, highlights, flashcards, and quizzes to help you learn more effectively."
    },
    {
      question: "What file formats are supported?",
      answer: "We support YouTube videos (via URL), PDF documents, audio/video files (MP3, MP4, WAV, etc.), and websites. Simply paste the URL or upload your file to get started."
    },
    {
      question: "Is my data secure?",
      answer: "Yes! Your data is stored securely in the cloud with encryption. Only you can access your notes and study materials. We never share your information with third parties."
    },
    {
      question: "Can I edit the AI-generated notes?",
      answer: "Absolutely! You can edit any AI-generated content, rename your notes, and customize everything to fit your learning style. All changes are saved automatically."
    },
    {
      question: "How accurate are the AI-generated summaries?",
      answer: "Our AI is highly accurate and continuously improving. However, we recommend reviewing the generated content and making adjustments as needed. The AI serves as a powerful tool to accelerate your learning process."
    },
    {
      question: "Can I translate my notes to other languages?",
      answer: "Yes! StudyScribe.AI supports multiple languages including Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic, Russian, and Hindi. You can translate any note with just a few clicks."
    },
    {
      question: "What is the AI Chat feature?",
      answer: "The AI Chat feature allows you to have an interactive conversation about your study materials. Ask questions, request clarifications, or dive deeper into specific topics - the AI will respond based on your uploaded content."
    },
    {
      question: "How long does it take to process materials?",
      answer: "Processing time varies depending on the length and type of content. Most materials are processed within 1-3 minutes. You'll receive a notification when your study pack is ready."
    }
  ];

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="container relative mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5 text-xs font-medium text-primary">
            FAQ
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Frequently Asked{" "}
            <span className="text-gradient animate-gradient">Questions</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Have questions? We've got answers. Find everything you need to know about StudyScribe.AI.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="glass-card rounded-2xl px-6 border-0 hover:shadow-glow transition-all duration-300"
            >
              <AccordionTrigger className="text-left hover:no-underline py-5">
                <span className="font-semibold text-base">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
