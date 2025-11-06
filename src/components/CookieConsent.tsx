import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowConsent(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
      <Card className="p-4 shadow-elevated">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Cookie Settings</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We use cookies to save your login information and preferences. 
              By accepting, you agree to our use of cookies for a better experience.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAccept}>
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={handleDecline}>
                Decline
              </Button>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={handleDecline}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;
