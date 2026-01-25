import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const About = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl text-center">About this website</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <p className="text-center leading-relaxed">
              This is a <span className="font-bold text-foreground">personal project</span> made by{" "}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link 
                    to="/about-owner" 
                    className="font-bold text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    Yiming
                    <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">👤</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to know more about me!</p>
                </TooltipContent>
              </Tooltip>
              {" "}from <span className="font-bold underline text-foreground">FISJB.</span> You may see some parts of the 
              website malfunctioning, but hopefully it works when you are using it. I am very proud of the AI integration 
              of this website lol, credit to all of the transcription, summarization, note creation, translation APIs ✌️. 
              I hope my project can bring more opportunity for these kind of study apps to be created.
            </p>
            
            <p className="text-center text-sm">
              Made in 12/Oct/2025
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default About;
