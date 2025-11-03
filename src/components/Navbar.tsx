import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logoImage from "@/assets/studyscribe_logo.webp";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logoImage} alt="StudyScribe.AI Logo" className="w-8 h-8" />
          <span className="font-bold text-xl">StudyScribe.AI</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/auth">
            <Button variant="default">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
