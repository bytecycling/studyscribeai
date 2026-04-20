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
