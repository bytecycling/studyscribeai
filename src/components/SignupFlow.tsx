import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

interface SignupData {
  signupMethod: 'email' | 'google' | '';
  email: string;
  password: string;
  fullName: string;
  referralSource: string;
  educationLevel: string;
  language: string;
  acceptedTerms: boolean;
}

const SignupFlow = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check URL params for Google OAuth return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlStep = params.get('step');
    const method = params.get('method');
    if (urlStep && method === 'google') {
      const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check if they already have preferences set
          if (user.user_metadata?.language_preference) {
            navigate('/dashboard');
          } else {
            setStep(parseInt(urlStep));
            setSignupData(prev => ({ ...prev, signupMethod: 'google' }));
          }
        }
      };
      checkUser();
    }
  }, [navigate]);
  
  const [signupData, setSignupData] = useState<SignupData>({
    signupMethod: '',
    email: '',
    password: '',
    fullName: '',
    referralSource: '',
    educationLevel: '',
    language: 'english',
    acceptedTerms: false,
  });

  const handleGoogleSignIn = async () => {
    if (!signupData.acceptedTerms) {
      toast({
        title: "Error",
        description: "Please accept the Terms of Service and Privacy Policy",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      // Proceed directly to Google OAuth
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth?step=2&method=google`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const completeGoogleSignup = async () => {
    try {
      setIsLoading(true);
      
      // Save user preferences to user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          referral_source: signupData.referralSource,
          education_level: signupData.educationLevel,
          language_preference: signupData.language,
        }
      });

      if (error) throw error;

      toast({
        title: "Welcome!",
        description: "Your account has been set up successfully",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: signupData.fullName,
            referral_source: signupData.referralSource,
            education_level: signupData.educationLevel,
            language_preference: signupData.language,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Welcome to StudyScribe.AI",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1.5) {
      setStep(2);
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step === 1.5) {
      setStep(1);
    } else {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    if (step === 1) return signupData.acceptedTerms;
    if (step === 1.5 && signupData.signupMethod === 'email') {
      return signupData.email && signupData.password && signupData.fullName && signupData.acceptedTerms;
    }
    if (step === 2) return signupData.referralSource !== '';
    if (step === 3) return signupData.educationLevel !== '';
    if (step === 4) return signupData.language !== '';
    return true;
  };

  return (
    <Card className="shadow-elevated w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <span className="text-sm text-muted-foreground">Step {Math.floor(step)}/{signupData.signupMethod === 'google' ? '4' : '4'}</span>
        </div>
        <CardDescription>
          {step === 1 && "Choose how you'd like to sign up"}
          {step === 1.5 && signupData.signupMethod === 'email' && "Enter your details"}
          {step === 1.5 && signupData.signupMethod === 'google' && "Continue with your Google account"}
          {step === 2 && "How did you hear about us?"}
          {step === 3 && "What's your education level?"}
          {step === 4 && "Choose your language preference"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="min-h-[300px] animate-fade-in">
          {step === 1 && (
            <div className="space-y-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleSignIn}
                disabled={isLoading || !signupData.acceptedTerms}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!signupData.acceptedTerms}
                onClick={() => {
                  setSignupData({ ...signupData, signupMethod: 'email' });
                  setTimeout(() => nextStep(), 100);
                }}
              >
                Continue with Email
              </Button>

              <div className="flex items-start space-x-2 pt-4">
                <Checkbox 
                  id="terms" 
                  checked={signupData.acceptedTerms}
                  onCheckedChange={(checked) => 
                    setSignupData({ ...signupData, acceptedTerms: checked === true })
                  }
                />
                <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                  I accept the{" "}
                  <Link 
                    to="/terms" 
                    state={{ returnTo: '/auth', signupData, step }}
                    className="text-primary hover:underline"
                  >
                    Terms of Service
                  </Link>
                  {" "}and{" "}
                  <Link 
                    to="/privacy" 
                    state={{ returnTo: '/auth', signupData, step }}
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>
          )}

          {step === 1.5 && signupData.signupMethod === 'email' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={signupData.fullName}
                  onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  minLength={6}
                  required
                />
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox 
                  id="terms-email" 
                  checked={signupData.acceptedTerms}
                  onCheckedChange={(checked) => 
                    setSignupData({ ...signupData, acceptedTerms: checked === true })
                  }
                />
                <Label htmlFor="terms-email" className="text-sm leading-tight cursor-pointer">
                  I accept the{" "}
                  <Link 
                    to="/terms" 
                    state={{ returnTo: '/auth', signupData, step }}
                    className="text-primary hover:underline"
                  >
                    Terms of Service
                  </Link>
                  {" "}and{" "}
                  <Link 
                    to="/privacy" 
                    state={{ returnTo: '/auth', signupData, step }}
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>
          )}


          {step === 2 && (
            <RadioGroup
              value={signupData.referralSource}
              onValueChange={(value) => setSignupData({ ...signupData, referralSource: value })}
            >
              {['YouTube', 'Instagram', 'Fairview International School Johor', 'Other'].map((source) => (
                <div key={source} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value={source.toLowerCase()} id={source} />
                  <Label htmlFor={source} className="flex-1 cursor-pointer">{source}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {step === 3 && (
            <RadioGroup
              value={signupData.educationLevel}
              onValueChange={(value) => setSignupData({ ...signupData, educationLevel: value })}
            >
              {['High School Student', 'College Student', 'Undergraduate', 'Postgraduate', 'Higher Education'].map((level) => (
                <div key={level} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value={level.toLowerCase()} id={level} />
                  <Label htmlFor={level} className="flex-1 cursor-pointer">{level}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {step === 4 && (
            <RadioGroup
              value={signupData.language}
              onValueChange={(value) => setSignupData({ ...signupData, language: value })}
            >
              {['English', 'Español', 'Français', '中文', '日本語', 'Bahasa Melayu'].map((lang) => (
                <div key={lang} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value={lang.toLowerCase()} id={lang} />
                  <Label htmlFor={lang} className="flex-1 cursor-pointer">{lang}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

        </div>

        <div className="flex gap-2">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          
          {step < 4 && (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed() || isLoading}
              className="flex-1"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {step === 4 && signupData.signupMethod === 'email' && (
            <Button
              type="button"
              onClick={handleEmailSignup}
              disabled={isLoading || !canProceed()}
              className="flex-1"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          )}

          {step === 4 && signupData.signupMethod === 'google' && (
            <Button
              type="button"
              onClick={completeGoogleSignup}
              disabled={isLoading || !canProceed()}
              className="flex-1"
            >
              {isLoading ? "Completing Sign Up..." : "Complete Sign Up"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SignupFlow;
