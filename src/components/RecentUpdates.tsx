import { Sparkles, Palette, Wrench, Type, Layers, Globe } from "lucide-react";

const updates = [
  {
    date: "Apr 20, 2026",
    icon: Globe,
    title: "Language switcher in homepage navbar",
    description: "Switch the entire app's language right from the top bar — native names like 中文（简体）.",
    tag: "New",
  },
  {
    date: "Apr 20, 2026",
    icon: Layers,
    title: "Glassmorphism across the whole app",
    description: "Auth, Dashboard, History, and Profile pages now share the same glass + gradient aesthetic.",
    tag: "Design",
  },
  {
    date: "Apr 19, 2026",
    icon: Sparkles,
    title: "Bold & vibrant homepage redesign",
    description: "New gradient mesh background, animated hero, How-it-works flow, and feature card hover effects.",
    tag: "Design",
  },
  {
    date: "Apr 18, 2026",
    icon: Palette,
    title: "New animated background",
    description: "Floating gradient blobs and a subtle mesh give every page more depth and motion.",
    tag: "Design",
  },
  {
    date: "Apr 15, 2026",
    icon: Wrench,
    title: "All core upload functions live",
    description: "YouTube, PDF, Audio/Video, and Website ingestion are all working end-to-end.",
    tag: "Feature",
  },
  {
    date: "Apr 12, 2026",
    icon: Type,
    title: "Better fonts & typography",
    description: "Cleaner heading hierarchy, tighter tracking, and improved readability across notes.",
    tag: "Polish",
  },
  {
    date: "Apr 10, 2026",
    icon: Wrench,
    title: "LaTeX rendering fixes",
    description: "Math formulas now render reliably with KaTeX — block math, inline math, and escaped backslashes.",
    tag: "Fix",
  },
];

const tagStyles: Record<string, string> = {
  New: "bg-primary/15 text-primary border-primary/30",
  Design: "bg-accent/15 text-accent border-accent/30",
  Feature: "bg-primary/15 text-primary border-primary/30",
  Polish: "bg-muted text-muted-foreground border-border",
  Fix: "bg-accent/15 text-accent border-accent/30",
};

const RecentUpdates = () => {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30" />

      <div className="container relative mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5 text-xs font-medium text-primary">
            Changelog
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Recent{" "}
            <span className="text-gradient animate-gradient">updates</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            What's new in StudyScribe.AI — shipped continuously.
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Vertical timeline line */}
          <div className="absolute left-5 sm:left-6 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-accent/30 to-transparent" />

          <ol className="space-y-6">
            {updates.map((update, index) => (
              <li
                key={index}
                className="reveal-on-scroll relative pl-14 sm:pl-16"
              >
                {/* Icon dot */}
                <div className="absolute left-0 top-1 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-soft">
                  <update.icon className="w-5 h-5 text-primary-foreground" />
                </div>

                <div className="glass-card rounded-2xl p-5 hover:-translate-y-0.5 transition-transform duration-300">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {update.date}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${
                        tagStyles[update.tag] ?? tagStyles.Polish
                      }`}
                    >
                      {update.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{update.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {update.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default RecentUpdates;
