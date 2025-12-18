import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

// Initialize mermaid with dark theme support
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
  },
  themeVariables: {
    darkMode: true,
    background: 'transparent',
    primaryColor: '#3b82f6',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#60a5fa',
    lineColor: '#94a3b8',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    noteTextColor: '#f8fafc',
    noteBkgColor: '#1e293b',
    noteBorderColor: '#3b82f6',
    nodeBorder: '#60a5fa',
    mainBkg: '#1e293b',
    nodeTextColor: '#f8fafc',
    clusterBkg: '#0f172a',
    clusterBorder: '#3b82f6',
    edgeLabelBackground: '#1e293b',
  },
});

export default function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!chart.trim()) return;

      try {
        // Generate unique ID for the diagram
        const id = `mermaid-${Math.random().toString(36).substring(7)}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(id, chart.trim());
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram');
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className={`p-4 bg-destructive/10 text-destructive rounded-md ${className}`}>
        <p className="text-sm">{error}</p>
        <pre className="mt-2 text-xs overflow-auto">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={`p-4 bg-muted rounded-md animate-pulse ${className}`}>
        <div className="h-32 bg-muted-foreground/10 rounded"></div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`mermaid-container bg-transparent overflow-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
