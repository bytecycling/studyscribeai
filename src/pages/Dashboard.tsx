import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import YouTubeUpload from "@/components/YouTubeUpload";
import AudioUpload from "@/components/AudioUpload";
import PdfUpload from "@/components/PdfUpload";
import WebsiteUpload from "@/components/WebsiteUpload";
import NotesList from "@/components/NotesList";

const Dashboard = () => {
  const navigate = useNavigate();
  const [refreshNotes, setRefreshNotes] = useState(0);

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleUploadSuccess = () => {
    setRefreshNotes(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">StudyScribe.AI</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/history">
              <Button variant="ghost" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">Welcome back!</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Your Study Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Transform your learning materials into comprehensive study notes
          </p>
        </div>

        {/* Upload Tabs */}
        <Tabs defaultValue="youtube" className="mb-12">
          <TabsList className="grid w-full grid-cols-4 max-w-4xl mx-auto">
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
            <TabsTrigger value="audio">Audio/Video</TabsTrigger>
            <TabsTrigger value="pdf">PDF</TabsTrigger>
            <TabsTrigger value="website">Website</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="youtube">
              <YouTubeUpload onSuccess={handleUploadSuccess} />
            </TabsContent>
            
            <TabsContent value="audio">
              <AudioUpload onSuccess={handleUploadSuccess} />
            </TabsContent>
            
            <TabsContent value="pdf">
              <PdfUpload onSuccess={handleUploadSuccess} />
            </TabsContent>

            <TabsContent value="website">
              <WebsiteUpload onSuccess={handleUploadSuccess} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Recent Notes Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Study Notes</h2>
          <NotesList refreshTrigger={refreshNotes} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
