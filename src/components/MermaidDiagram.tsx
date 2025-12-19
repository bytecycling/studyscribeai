import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

// Initialize mermaid with proper configuration based on official docs
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  logLevel: 'fatal', // Suppress all but fatal errors
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 15,
    nodeSpacing: 50,
    rankSpacing: 50,
    useMaxWidth: true,
  },
  sequence: {
    useMaxWidth: true,
    wrap: true,
  },
  themeVariables: {
    darkMode: true,
    background: '#1e293b',
    primaryColor: '#3b82f6',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#60a5fa',
    lineColor: '#94a3b8',
    secondaryColor: '#475569',
    tertiaryColor: '#334155',
    noteTextColor: '#f8fafc',
    noteBkgColor: '#334155',
    noteBorderColor: '#3b82f6',
    nodeBorder: '#60a5fa',
    mainBkg: '#475569',
    nodeTextColor: '#f8fafc',
    clusterBkg: '#1e293b',
    clusterBorder: '#3b82f6',
    edgeLabelBackground: '#334155',
    textColor: '#f8fafc',
    fontSize: '14px',
  },
});

// Function to sanitize mermaid chart content
function sanitizeChart(chart: string): string {
  let cleaned = chart.trim();
  
  // Remove any leading/trailing backticks or language identifiers
  cleaned = cleaned.replace(/^```mermaid\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  
  // Fix common issues with node labels containing special characters
  // Replace problematic characters in labels
  cleaned = cleaned.replace(/\[([^\]]*)\]/g, (match, label) => {
    // Clean up labels - remove LaTeX, parentheses issues
    let cleanLabel = label
      .replace(/\$[^$]*\$/g, '') // Remove LaTeX
      .replace(/\\\w+/g, '') // Remove backslash commands
      .replace(/[{}]/g, '') // Remove braces
      .trim();
    return `[${cleanLabel || 'Node'}]`;
  });
  
  // Ensure diagram type is on first line
  const lines = cleaned.split('\n').filter(line => line.trim());
  if (lines.length === 0) return 'graph TD\n    A[Start] --> B[End]';
  
  // Check if first line has a valid diagram type
  const firstLine = lines[0].trim().toLowerCase();
  const validTypes = ['graph', 'flowchart', 'sequencediagram', 'classdiagram', 'statediagram', 'erdiagram', 'journey', 'gantt', 'pie', 'gitgraph', 'mindmap', 'timeline'];
  const hasValidType = validTypes.some(type => firstLine.startsWith(type));
  
  if (!hasValidType) {
    // Default to flowchart if no valid type
    cleaned = 'graph TD\n' + cleaned;
  }
  
  return cleaned;
}

export default function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!chart.trim()) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Sanitize the chart content
        const cleanChart = sanitizeChart(chart);
        
        // Generate unique ID for the diagram
        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
        
        // Re-initialize mermaid to ensure clean state
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          suppressErrorRendering: true,
          logLevel: 'fatal',
        });
        
        // Try to render the diagram
        const { svg: renderedSvg } = await mermaid.render(id, cleanChart);
        setSvg(renderedSvg);
      } catch (err) {
        console.warn('Mermaid rendering warning:', err);
        
        // Create a simple fallback diagram instead of showing an error
        try {
          const fallbackId = `mermaid-fallback-${Math.random().toString(36).substring(2, 11)}`;
          const fallbackChart = `graph TD
    A[Diagram] --> B[Content Available]
    B --> C[View in Editor]`;
          const { svg: fallbackSvg } = await mermaid.render(fallbackId, fallbackChart);
          setSvg(fallbackSvg);
        } catch {
          // If even fallback fails, show nothing (hide the component)
          setSvg('');
        }
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [chart]);

  // Don't render anything if no SVG and not loading
  if (!isLoading && !svg) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`p-4 bg-muted rounded-lg animate-pulse ${className}`}>
        <div className="h-32 bg-muted-foreground/10 rounded flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Loading diagram...</span>
        </div>
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