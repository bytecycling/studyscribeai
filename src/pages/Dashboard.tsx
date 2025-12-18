import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, LogOut, FolderOpen, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logoImage from "@/assets/studyscribe_logo.png";
import { supabase } from "@/integrations/supabase/client";
import YouTubeUpload from "@/components/YouTubeUpload";
import AudioUpload from "@/components/AudioUpload";
import PdfUpload from "@/components/PdfUpload";
import WebsiteUpload from "@/components/WebsiteUpload";
import NotesList from "@/components/NotesList";
import SettingsMenu from "@/components/SettingsMenu";
import FolderManager from "@/components/FolderManager";

const Dashboard = () => {
  const navigate = useNavigate();
  const [refreshNotes, setRefreshNotes] = useState(0);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check for dev mode first
    const isDevMode = localStorage.getItem('devMode') === 'true';
    if (isDevMode) return; // Skip auth check in dev mode

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const devMode = localStorage.getItem('devMode') === 'true';
      if (!session && !devMode) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    const isDevMode = localStorage.getItem('devMode') === 'true';
    if (isDevMode) return; // Skip auth check in dev mode
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('devMode'); // Clear dev mode on sign out
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
            <img src={logoImage} alt="StudyScribe.AI Logo" className="h-10 w-auto" />
            <span className="font-bold text-xl">StudyScribe.AI</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/history">
              <Button variant="ghost" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" size="sm">
                Profile
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">Welcome back!</span>
            <SettingsMenu onClearHistory={handleUploadSuccess} />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 relative">
        {/* Floating toggle button */}
        <Button
          size="icon"
          variant="outline"
          className="fixed left-4 top-24 z-40 shadow-lg hover:scale-110 transition-transform"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <FolderOpen className="w-5 h-5" />
        </Button>

        {/* Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Collapsible Sidebar */}
        <aside 
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-background border-r border-border z-50 p-6 shadow-xl transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Organize</h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <FolderManager 
            selectedFolderId={selectedFolderId}
            onFolderSelect={(id) => {
              setSelectedFolderId(id);
              setSidebarOpen(false);
            }}
          />
        </aside>

        {/* Main content */}
        <div className="w-full">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">Your Study Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Transform your learning materials into comprehensive study notes
            </p>
          </div>

          {/* Upload Tabs */}
          <Tabs defaultValue="youtube" className="mb-12">
            <TabsList className="grid w-full grid-cols-4">
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
            <NotesList refreshTrigger={refreshNotes} folderId={selectedFolderId} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
