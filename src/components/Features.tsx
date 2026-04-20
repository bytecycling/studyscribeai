import { Youtube, FileAudio, FileText, Brain, Languages, Highlighter } from "lucide-react";

const features = [
  {
    icon: Youtube,
    title: "YouTube Transcription",
    description: "Convert any YouTube video into detailed, organized study notes with AI-powered summarization.",
  },
  {
    icon: FileAudio,
    title: "Audio & Video Processing",
    description: "Upload MP3 or MP4 files and get comprehensive transcriptions and summaries instantly.",
  },
  {
    icon: FileText,
    title: "PDF Analysis",
    description: "Extract key information from PDFs and transform them into actionable study materials.",
  },
  {
    icon: Brain,
    title: "AI Chat Assistant",
    description: "Ask questions and discuss your study materials with an intelligent AI tutor.",
  },
  {
    icon: Languages,
    title: "Multi-Language Support",
    description: "Translate your notes into multiple languages for enhanced learning.",
  },
  {
    icon: Highlighter,
    title: "Smart Highlighting",
    description: "Automatically highlight important points with customizable color coding.",
  },
];

const Features = () => {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-50" />

      <div className="container relative mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5 text-xs font-medium text-primary">
            Features
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Everything You Need to{" "}
            <span className="text-gradient animate-gradient">Study Smarter</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful AI tools designed to transform how you learn and retain information.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="reveal-on-scroll group relative p-7 rounded-2xl glass-card hover:-translate-y-1 hover:shadow-glow transition-all duration-300 overflow-hidden"
            >
              {/* Hover gradient sheen */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/10 transition-all duration-500 pointer-events-none" />

              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-5 shadow-soft group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
