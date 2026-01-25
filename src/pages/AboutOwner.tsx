import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Code, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AboutOwner = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Code className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">About the Owner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <p className="text-lg leading-relaxed">
              Hi guys! Nice of you to find this detail about this website. I am the creator of this website, <span className="font-bold text-foreground">Yiming</span>. A student from <span className="font-bold text-foreground">Fairview International School JB</span>.
            </p>
            
            <div className="flex items-center gap-2 text-primary">
              <Heart className="h-5 w-5 fill-current" />
              <span className="font-medium">Made with love for coding</span>
            </div>
            
            <p className="text-lg leading-relaxed">
              I made this because of my love for coding, and also for my personal project. If you know, you know.
            </p>
            
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <p className="text-sm italic flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span>
                  <span className="font-semibold">P.S also a secret:</span> I spent like 7 months making it, it's so tough right. Hopefully I get 24/24 for PP :D
                </span>
              </p>
            </div>
            
            <p className="text-center text-sm text-muted-foreground pt-4">
              Thank you for visiting StudyScribe.AI! ✌️
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutOwner;
