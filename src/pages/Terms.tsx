import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/auth" className="inline-flex items-center gap-2 mb-6 text-background hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-4 h-4" />
          Back to Sign Up
        </Link>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shadow-glow">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-background">StudyScribe.AI</h1>
        </div>

        <Card className="shadow-elevated mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: 1 November 2025</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <p>
              Welcome to StudyScribe ("we", "our", "us"). By creating an account or using our website and services, 
              you agree to follow these Terms of Service ("Terms"). Please read them carefully.
            </p>

            <div>
              <h3 className="font-semibold text-lg mb-2">1. Overview of Service</h3>
              <p>
                StudyScribe allows users to upload videos, PDFs, and website links to automatically generate notes using AI. 
                Users may access free and paid subscription plans.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">2. Eligibility</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Users must be at least 9 years old to use StudyScribe.</li>
                <li>If you are under 18, you must have permission from a parent or legal guardian.</li>
                <li>By using the service, you confirm that you are legally allowed to do so under the laws of Malaysia.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">3. Account Registration</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>You must create an account using a valid email address.</li>
                <li>You are responsible for keeping your login details secure.</li>
                <li>Any activity under your account will be considered your responsibility.</li>
                <li>You must provide accurate and truthful information.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">4. User Content</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>You may upload videos, PDFs and website links ("Content").</li>
                <li>You allow StudyScribe to store, process and use this content to generate AI notes.</li>
                <li>Your content remains private and will not be publicly shared with other users without your permission.</li>
                <li>You are responsible for ensuring your uploaded content does not violate copyright or contain illegal material.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">5. Use of AI</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>StudyScribe uses Gemini API to generate notes from uploaded materials.</li>
                <li>To improve AI performance, your content may be used to train or refine AI models unless you request otherwise (where applicable by law).</li>
                <li>We do not guarantee that AI-generated notes will always be accurate or complete.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">6. Payments and Subscriptions</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Paid plans are processed via Stripe.</li>
                <li>All fees are displayed in the platform and are non-refundable unless required by law.</li>
                <li>You may cancel your subscription anytime, but access to paid features will continue only until the billing period ends.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">7. Prohibited Activities</h3>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Upload copyrighted material you do not own or have rights to.</li>
                <li>Use StudyScribe for harmful, illegal or fraudulent purposes.</li>
                <li>Attempt to reverse engineer, hack or disrupt the system.</li>
                <li>Share or resell our services to others without permission.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">8. Termination</h3>
              <p>We may suspend or terminate your account if:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>You violate these Terms.</li>
                <li>Required by law or regulatory authorities.</li>
                <li>Fraudulent or harmful activity is detected.</li>
              </ul>
              <p className="mt-2">You may also delete your account at any time.</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">9. Disclaimer of Warranties</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>StudyScribe is provided "as is" and "as available".</li>
                <li>We do not guarantee the service will always be uninterrupted, error-free or accurate.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">10. Limitation of Liability</h3>
              <p>To the extent permitted by Malaysian law, we are not responsible for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Loss of data or profits</li>
                <li>Service interruptions</li>
                <li>Inaccurate AI-generated content</li>
              </ul>
              <p className="mt-2">Our total liability will not exceed the amount you paid (if any) in the last 3 months.</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">11. Changes to Terms</h3>
              <p>
                We may update these Terms occasionally. If changes are significant, you will be notified via email or platform notice.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">12. Contact Information</h3>
              <p>
                For questions about these Terms, contact:<br />
                Email: <a href="mailto:sqym0327@gmail.com" className="text-primary hover:underline">sqym0327@gmail.com</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
