import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KeyRound } from 'lucide-react';

const Footer = () => {
  const [devCode, setDevCode] = useState('');
  const [showEnterButton, setShowEnterButton] = useState(false);
  const navigate = useNavigate();

  const handleDevCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setDevCode(code);
    setShowEnterButton(code === 'Fairview');
  };

  const handleEnterDevMode = () => {
    if (devCode === 'Fairview') {
      localStorage.setItem('devMode', 'true');
      navigate('/dashboard');
    }
  };

  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        <p>Made by Yiming • 2025 Personal Project</p>
        <p className="mt-2 text-sm">
          Powered by Gemini AI • Built with ❤️ for students everywhere
        </p>
        <div className="mt-6 max-w-xs mx-auto space-y-2">
          <Input
            type="password"
            placeholder="Developer access..."
            value={devCode}
            onChange={handleDevCodeChange}
            className="text-center text-xs h-8 bg-transparent border-muted-foreground/20 focus:border-primary/50"
          />
          {showEnterButton && (
            <Button 
              onClick={handleEnterDevMode}
              size="sm"
              className="w-full"
            >
              <KeyRound className="w-3 h-3 mr-2" />
              Enter Developer Mode
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
