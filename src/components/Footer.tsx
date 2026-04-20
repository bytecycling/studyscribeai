import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="relative py-10 border-t border-border/50">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground">
          {t("footer.text")} <span className="text-gradient font-semibold">Yiming</span> {t("footer.suffix")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
