import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

// Initialize mermaid with proper theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 20,
    nodeSpacing: 50,
    rankSpacing: 50,
  },
  themeVariables: {
    darkMode: true,
    background: '#1e293b',
    primaryColor: '#3b82f6',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#60a5fa',
    lineColor: '#94a3b8',
    secondaryColor: '#334155',
    tertiaryColor: '#1e293b',
    noteTextColor: '#f8fafc',
    noteBkgColor: '#334155',
    noteBorderColor: '#3b82f6',
    nodeBorder: '#60a5fa',
    mainBkg: '#334155',
    nodeTextColor: '#f8fafc',
    clusterBkg: '#1e293b',
    clusterBorder: '#3b82f6',
    edgeLabelBackground: '#1e293b',
    textColor: '#f8fafc',
    fontSize: '14px',
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
        // Clean the chart content
        let cleanChart = chart.trim();
        
        // Generate unique ID for the diagram
        const id = `mermaid-${Math.random().toString(36).substring(7)}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(id, cleanChart);
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
        <pre className="mt-2 text-xs overflow-auto bg-muted p-2 rounded">{chart}</pre>
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
      className={`mermaid-container p-4 rounded-lg bg-slate-800/50 border border-slate-700 overflow-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
