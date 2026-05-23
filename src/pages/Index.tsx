import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import RecentUpdates from "@/components/RecentUpdates";
import FAQ from "@/components/FAQ";
import About from "@/components/About";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import SEO from "@/components/SEO";

const FAQ_ITEMS: Array<[string, string]> = [
  ["How does StudyScribe.AI work?", "StudyScribe.AI uses advanced AI to analyze your learning materials (YouTube videos, PDFs, audio files, or websites) and automatically generates comprehensive study notes, highlights, flashcards, and quizzes."],
  ["What file formats are supported?", "We support YouTube videos (via URL), PDF documents, audio/video files (MP3, MP4, WAV, etc.), and websites."],
  ["Is my data secure?", "Yes. Your data is stored securely in the cloud with encryption. Only you can access your notes."],
  ["Can I edit the AI-generated notes?", "Yes. You can edit any AI-generated content; all changes are saved automatically."],
  ["How accurate are the AI-generated summaries?", "Our AI is highly accurate and continuously improving. We recommend reviewing the generated content."],
  ["Can I translate my notes to other languages?", "Yes. StudyScribe.AI supports multiple languages including Spanish, French, German, Chinese, Japanese, and more."],
  ["What is the AI Chat feature?", "AI Chat lets you have an interactive conversation about your study materials grounded in your uploaded content."],
  ["How long does it take to process materials?", "Most materials are processed within 1-3 minutes depending on length and type."],
];

const Index = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Keep observing off after first reveal for performance
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el, i) => {
      // Stagger child reveals slightly
      (el as HTMLElement).style.transitionDelay = `${Math.min(i * 60, 300)}ms`;
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <Hero />
        <HowItWorks />
        <Features />
        <RecentUpdates />
        <FAQ />
        <About />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
};

export default Index;
