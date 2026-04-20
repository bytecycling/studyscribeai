import { Upload, Sparkles, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";

const HowItWorks = () => {
  const { t } = useTranslation();
  const steps = [
    { icon: Upload, number: "01", title: t("how.s1Title"), description: t("how.s1Desc") },
    { icon: Sparkles, number: "02", title: t("how.s2Title"), description: t("how.s2Desc") },
    { icon: GraduationCap, number: "03", title: t("how.s3Title"), description: t("how.s3Desc") },
  ];

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="container relative mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5 text-xs font-medium text-primary">
            {t("how.badge")}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            {t("how.title")}{" "}
            <span className="text-gradient animate-gradient">{t("how.titleAccent")}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("how.subtitle")}
          </p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-0.5">
            <div className="w-full h-full bg-gradient-to-r from-primary/0 via-primary/40 to-accent/0" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
            {steps.map((step, index) => (
              <div key={index} className="reveal-on-scroll relative flex flex-col items-center text-center">
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
