import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

const About = () => {
  const { t } = useTranslation();
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      <div className="container relative mx-auto px-4">
        <div className="max-w-3xl mx-auto glass-card rounded-3xl p-8 md:p-12">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 mb-5 text-xs font-medium text-primary">
              {t("about.badge")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t("about.title")}{" "}
              <span className="text-gradient animate-gradient">{t("about.titleAccent")}</span>
            </h2>
          </div>

          <p className="text-center leading-relaxed text-muted-foreground">
            {t("about.body1")}{" "}
            <span className="font-semibold text-foreground">{t("about.personalProject")}</span>{" "}
            {t("about.madeBy")}{" "}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/about-owner"
                  className="font-semibold text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  {t("about.yiming")}
                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">👤</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("about.tooltip")}</p>
              </TooltipContent>
            </Tooltip>
            {" "}<span className="font-semibold underline text-foreground">{t("about.fromFisjb")}</span>{" "}
            {t("about.body2")}
          </p>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {t("about.madeOn")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
