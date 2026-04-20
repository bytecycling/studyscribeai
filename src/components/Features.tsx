import { Youtube, FileAudio, FileText, Brain, Languages, Highlighter } from "lucide-react";
import { useTranslation } from "react-i18next";

const Features = () => {
  const { t } = useTranslation();
  const features = [
    { icon: Youtube, title: t("features.youtubeT"), description: t("features.youtubeD") },
    { icon: FileAudio, title: t("features.audioT"), description: t("features.audioD") },
    { icon: FileText, title: t("features.pdfT"), description: t("features.pdfD") },
    { icon: Brain, title: t("features.aiT"), description: t("features.aiD") },
    { icon: Languages, title: t("features.langT"), description: t("features.langD") },
    { icon: Highlighter, title: t("features.highlightT"), description: t("features.highlightD") },
  ];

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-50" />

      <div className="container relative mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5 text-xs font-medium text-primary">
            {t("features.badge")}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            {t("features.title")}{" "}
            <span className="text-gradient animate-gradient">{t("features.titleAccent")}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="reveal-on-scroll group relative p-7 rounded-2xl glass-card hover:-translate-y-1 hover:shadow-glow transition-all duration-300 overflow-hidden"
            >
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
