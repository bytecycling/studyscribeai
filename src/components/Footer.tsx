import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';

const Footer = () => {
  const [devCode, setDevCode] = useState('');
  const navigate = useNavigate();

  const handleDevCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setDevCode(code);
    
    if (code === 'Fairview') {
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
        <div className="mt-6 max-w-xs mx-auto">
          <Input
            type="password"
            placeholder="Developer access..."
            value={devCode}
            onChange={handleDevCodeChange}
            className="text-center text-xs h-8 bg-transparent border-muted-foreground/20 focus:border-primary/50"
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
