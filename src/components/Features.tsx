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
    <section className="py-24 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to Study Smarter
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful AI tools designed to transform how you learn and retain information.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-card border border-border hover:shadow-elevated transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:shadow-glow transition-all duration-300">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
