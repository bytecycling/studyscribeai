import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ArrowLeft, Lock } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import logoImage from "@/assets/studyscribe_logo.png";

const Privacy = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo = location.state?.returnTo;
  const signupData = location.state?.signupData;
  const step = location.state?.step;

  useEffect(() => {
    // Store the return state in sessionStorage to preserve it
    if (returnTo) {
      sessionStorage.setItem('privacyReturnTo', returnTo);
      sessionStorage.setItem('privacyReturnState', JSON.stringify({ signupData, step }));
    }
  }, [returnTo, signupData, step]);

  const handleBack = () => {
    const storedReturnTo = sessionStorage.getItem('privacyReturnTo');
    const storedState = sessionStorage.getItem('privacyReturnState');
    
    if (storedReturnTo) {
      const state = storedState ? JSON.parse(storedState) : {};
      sessionStorage.removeItem('privacyReturnTo');
      sessionStorage.removeItem('privacyReturnState');
      navigate(storedReturnTo, { state });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/auth" className="inline-flex items-center gap-2 mb-6 text-background hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-4 h-4" />
          Back to Sign Up
        </Link>
        
        <div className="flex items-center gap-3 mb-8">
          <img src={logoImage} alt="StudyScribe.AI Logo" className="h-16 w-auto" />
          <h1 className="text-3xl font-bold text-background">Privacy Policy</h1>
        </div>

        <Card className="shadow-elevated mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">StudyScribe Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: 1 November 2025</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <p>
              Your privacy matters to us. This Privacy Policy explains how StudyScribe collects, uses and protects your information.
            </p>

            <div>
              <h3 className="font-semibold text-lg mb-2">1. Information We Collect</h3>
              
              <h4 className="font-semibold mt-4 mb-2">1.1 Account Information</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name (if provided)</li>
                <li>Email address</li>
                <li>Password (encrypted)</li>
              </ul>

              <h4 className="font-semibold mt-4 mb-2">1.2 Uploaded Content</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Videos, PDFs, website URLs uploaded to generate notes</li>
                <li>Content is stored securely on our servers and kept private</li>
              </ul>

              <h4 className="font-semibold mt-4 mb-2">1.3 Usage Data</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Pages visited, features used, timestamps</li>
                <li>Device and browser information</li>
              </ul>

              <h4 className="font-semibold mt-4 mb-2">1.4 Payment Information</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Payments are processed securely by Stripe</li>
                <li>We do not store your card details</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">2. How We Use Your Information</h3>
              <p>We use your data to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide AI-generated notes and personalize your experience</li>
                <li>Maintain and improve our services</li>
                <li>Train and enhance AI models (via Gemini API)</li>
                <li>Process payments for subscriptions</li>
                <li>Communicate updates, billing notices or security alerts</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">3. AI and Data Processing</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>StudyScribe uses the Gemini API (Google) to analyze and convert your files into notes.</li>
                <li>Your uploaded content may be used to train and improve AI systems, unless you request otherwise through email.</li>
                <li>AI-generated outputs may contain mistakes. Always verify important information.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">4. Data Storage and Security</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>User content and data are stored securely on servers.</li>
                <li>Passwords are encrypted.</li>
                <li>We use industry-standard measures to protect data from unauthorized access.</li>
                <li>However, no online system is 100% secure.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">5. Data Sharing</h3>
              <p>We do not sell or publicly share your data.</p>
              <p className="mt-2">We only share data with:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Gemini API (for AI processing)</li>
                <li>Stripe (for payment processing)</li>
                <li>Legal authorities if required by Malaysian law</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">6. Your Rights</h3>
              <p>Depending on the law, you may:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Request access to your data</li>
                <li>Request correction or deletion of your account</li>
                <li>Opt out of AI training by contacting us</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="mt-2">
                Send requests to: <a href="mailto:sqym0327@gmail.com" className="text-primary hover:underline">sqym0327@gmail.com</a>
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">7. Children's Privacy</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>StudyScribe is available to users 9 years and older.</li>
                <li>For users under 18, parental permission is required.</li>
                <li>We do not knowingly collect data from children under 9.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">8. Cookies</h3>
              <p>We may use cookies to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Keep you logged in</li>
                <li>Improve website performance and analytics</li>
              </ul>
              <p className="mt-2">
                You can disable cookies in browser settings, but this may affect your experience.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">9. Changes to this Policy</h3>
              <p>
                We may update this Privacy Policy occasionally. If the changes are important, we will notify you.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">10. Contact Us</h3>
              <p>
                For privacy concerns or data-related requests:<br />
                Email: <a href="mailto:sqym0327@gmail.com" className="text-primary hover:underline">sqym0327@gmail.com</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
