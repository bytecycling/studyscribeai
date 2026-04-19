import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const About = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      <div className="container relative mx-auto px-4">
        <div className="max-w-3xl mx-auto glass-card rounded-3xl p-8 md:p-12">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 mb-5 text-xs font-medium text-primary">
              About
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              About this{" "}
              <span className="text-gradient animate-gradient">website</span>
            </h2>
          </div>

          <p className="text-center leading-relaxed text-muted-foreground">
            This is a <span className="font-semibold text-foreground">personal project</span> made by{" "}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/about-owner"
                  className="font-semibold text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  Yiming
                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">👤</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to know more about me!</p>
              </TooltipContent>
            </Tooltip>
            {" "}from <span className="font-semibold underline text-foreground">FISJB.</span> You may see some parts of the
            website malfunctioning, but hopefully it works when you are using it. I am very proud of the AI integration
            of this website lol, credit to all of the transcription, summarization, note creation, translation APIs ✌️.
            I hope my project can bring more opportunity for these kind of study apps to be created.
          </p>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Made on 12 Oct 2025
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
