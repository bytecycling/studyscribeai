import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/studyscribe_logo.png";
import { logError } from "@/utils/logger";
import { useTranslation } from "react-i18next";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    education_level: '',
    language_preference: ''
  });
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalFlashcards: 0,
    totalQuizzes: 0
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || user.user_metadata?.full_name || '',
          email: user.email || '',
          education_level: profileData.education_level || '',
          language_preference: profileData.language_preference || 'english'
        });
      } else {
        setProfile({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          education_level: '',
          language_preference: 'english'
        });
      }
    } catch (error) {
      logError('Profile.loadProfile', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: notes } = await supabase
        .from('notes')
        .select('flashcards, quiz')
        .eq('user_id', user.id);

      if (notes) {
        const totalFlashcards = notes.reduce((acc, note) => {
          if (note.flashcards && typeof note.flashcards === 'string') {
            return acc + JSON.parse(note.flashcards).length;
          }
          return acc;
        }, 0);
        
        const totalQuizzes = notes.reduce((acc, note) => {
          if (note.quiz && typeof note.quiz === 'string') {
            return acc + JSON.parse(note.quiz).length;
          }
          return acc;
        }, 0);

        setStats({
          totalNotes: notes.length,
          totalFlashcards,
          totalQuizzes
        });
      }
    } catch (error) {
      logError('Profile.loadStats', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          education_level: profile.education_level,
          language_preference: profile.language_preference
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update language in localStorage and i18n live
      localStorage.setItem('language', profile.language_preference);
      i18n.changeLanguage(profile.language_preference);

      toast({
        title: t("profile.updated"),
        description: t("profile.updatedDesc")
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: t("common.error"),
        description: t("profile.pwTooShort"),
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: t("profile.pwUpdated"),
        description: t("profile.pwUpdatedDesc")
      });
      setNewPassword('');
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 gradient-mesh opacity-50 pointer-events-none" />

      {/* Glass Navbar */}
      <nav className="sticky top-3 z-40 mx-3 sm:mx-6">
        <div className="glass rounded-full px-4 sm:px-6 h-14 flex items-center justify-between shadow-soft max-w-6xl mx-auto">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logoImage} alt="StudyScribe.AI Logo" className="h-8 w-auto" />
            <span className="font-bold text-base sm:text-lg text-gradient animate-gradient">StudyScribe.AI</span>
          </Link>

          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t("common.backToDashboard")}</span>
            <span className="sm:hidden">{t("common.back")}</span>
          </Button>
        </div>
      </nav>

      <main className="relative container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight animate-fade-in">
          {t("profile.titleA")} <span className="text-gradient animate-gradient">{t("profile.titleB")}</span>
        </h1>

        <div className="grid gap-6">
          {/* Stats Card */}
          <Card className="glass-card border-border/50">

            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {t("profile.stats")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">{stats.totalNotes}</div>
                  <div className="text-sm text-muted-foreground">{t("profile.totalNotes")}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{stats.totalFlashcards}</div>
                  <div className="text-sm text-muted-foreground">{t("profile.flashcardsCreated")}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{stats.totalQuizzes}</div>
                  <div className="text-sm text-muted-foreground">{t("profile.quizzesTaken")}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>{t("profile.info")}</CardTitle>
              <CardDescription>{t("profile.infoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("profile.fullName")}</Label>
                <Input
                  id="fullName"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("profile.email")}</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="education">{t("profile.education")}</Label>
                <select
                  id="education"
                  value={profile.education_level}
                  onChange={(e) => setProfile({ ...profile, education_level: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">{t("profile.selectEducation")}</option>
                  <option value="high school student">{t("profile.eduHs")}</option>
                  <option value="college student">{t("profile.eduCollege")}</option>
                  <option value="undergraduate">{t("profile.eduUg")}</option>
                  <option value="postgraduate">{t("profile.eduPg")}</option>
                  <option value="higher education">{t("profile.eduHigher")}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">{t("profile.languagePref")}</Label>
                <select
                  id="language"
                  value={profile.language_preference}
                  onChange={(e) => setProfile({ ...profile, language_preference: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="english">English</option>
                  <option value="español">Español</option>
                  <option value="français">Français</option>
                  <option value="中文">中文</option>
                  <option value="日本語">日本語</option>
                  <option value="bahasa melayu">Bahasa Melayu</option>
                </select>
              </div>

              <Button onClick={handleUpdateProfile} disabled={loading} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {t("profile.saveChanges")}
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>{t("profile.changePassword")}</CardTitle>
              <CardDescription>{t("profile.changePasswordDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("profile.newPassword")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("profile.newPasswordPh")}
                />
              </div>

              <Button onClick={handleChangePassword} disabled={loading} className="w-full">
                {t("profile.updatePassword")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
