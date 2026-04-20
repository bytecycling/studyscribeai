import { Sparkles, Palette, Wrench, Type, Layers, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

const tagStyles: Record<string, string> = {
  New: "bg-primary/15 text-primary border-primary/30",
  Design: "bg-accent/15 text-accent border-accent/30",
  Feature: "bg-primary/15 text-primary border-primary/30",
  Polish: "bg-muted text-muted-foreground border-border",
  Fix: "bg-accent/15 text-accent border-accent/30",
};

const RecentUpdates = () => {
  const { t } = useTranslation();
  const updates = [
    { date: "Apr 20, 2026", icon: Globe, title: t("updates.u1T"), description: t("updates.u1D"), tagKey: "New" },
    { date: "Apr 20, 2026", icon: Layers, title: t("updates.u2T"), description: t("updates.u2D"), tagKey: "Design" },
    { date: "Apr 19, 2026", icon: Sparkles, title: t("updates.u3T"), description: t("updates.u3D"), tagKey: "Design" },
    { date: "Apr 18, 2026", icon: Palette, title: t("updates.u4T"), description: t("updates.u4D"), tagKey: "Design" },
    { date: "Apr 15, 2026", icon: Wrench, title: t("updates.u5T"), description: t("updates.u5D"), tagKey: "Feature" },
    { date: "Apr 12, 2026", icon: Type, title: t("updates.u6T"), description: t("updates.u6D"), tagKey: "Polish" },
    { date: "Apr 10, 2026", icon: Wrench, title: t("updates.u7T"), description: t("updates.u7D"), tagKey: "Fix" },
  ];

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30" />

      <div className="container relative mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5 text-xs font-medium text-primary">
            {t("updates.badge")}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            {t("updates.title")}{" "}
            <span className="text-gradient animate-gradient">{t("updates.titleAccent")}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("updates.subtitle")}
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-5 sm:left-6 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-accent/30 to-transparent" />

          <ol className="space-y-6">
            {updates.map((update, index) => (
              <li key={index} className="reveal-on-scroll relative pl-14 sm:pl-16">
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
                        tagStyles[update.tagKey] ?? tagStyles.Polish
                      }`}
                    >
                      {t(`updates.tags.${update.tagKey}`)}
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
