import { Upload, Sparkles, GraduationCap } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload",
    description: "Drop a YouTube link, PDF, audio file, or website. Anything you need to learn from.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "AI Processes",
    description: "Our AI extracts key concepts, formulas, and structures them into clear study notes.",
  },
  {
    icon: GraduationCap,
    number: "03",
    title: "Study",
    description: "Read, highlight, quiz yourself, and chat with AI. Master your material faster.",
  },
];

const HowItWorks = () => {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="container relative mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5 text-xs font-medium text-primary">
            How it works
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            From content to{" "}
            <span className="text-gradient animate-gradient">mastery in 3 steps</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A simple workflow designed to get you studying smarter in minutes.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line - desktop only */}
          <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-0.5">
            <div className="w-full h-full bg-gradient-to-r from-primary/0 via-primary/40 to-accent/0" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative flex flex-col items-center text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Icon circle */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                    <step.icon className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full glass flex items-center justify-center text-xs font-bold text-primary">
                    {step.number}
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
