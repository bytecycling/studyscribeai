import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* Animated mesh background */}
      <div className="absolute inset-0 gradient-mesh" />

      {/* Floating blobs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/30 blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-accent/25 blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/20 blur-3xl animate-blob" style={{ animationDelay: '6s' }} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="container relative z-10 mx-auto px-4 py-20 text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 shadow-soft">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Study Assistant</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6 pb-2 leading-[1.05] tracking-tight text-gradient animate-gradient animate-slide-up">
            StudyScribe.AI
          </h1>

          <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4 animate-slide-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
            Transform YouTube videos, audio files, and PDFs into comprehensive study notes.
            Create flashcards, take quizzes, and chat with AI about your content.
          </p>

          <p className="text-base md:text-lg text-primary/80 font-medium italic mb-12 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            The Brain Behind the Breakthrough
          </p>

          <div className="flex justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/auth">
              <Button variant="hero" size="lg" className="group rounded-full px-8 h-12 text-base">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
