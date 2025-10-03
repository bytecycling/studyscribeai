import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Youtube, FileAudio, FileText, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
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
            <span className="text-sm text-muted-foreground">Welcome back!</span>
            <Button variant="ghost" size="sm">
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

        {/* Upload Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-elevated transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:shadow-glow transition-all">
                <Youtube className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>YouTube Video</CardTitle>
              <CardDescription>
                Paste a YouTube URL to transcribe and summarize
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Start Transcription
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elevated transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-2 group-hover:shadow-glow transition-all">
                <FileAudio className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Audio/Video File</CardTitle>
              <CardDescription>
                Upload MP3 or MP4 files for processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Upload File
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elevated transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:shadow-glow transition-all">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>PDF Document</CardTitle>
              <CardDescription>
                Extract and summarize content from PDFs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Upload PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Notes Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Study Notes</h2>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                You don't have any study notes yet. Start by uploading your first learning material!
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
