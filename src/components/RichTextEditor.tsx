import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline, Highlighter, Type, Palette, SquareFunction } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedSize, setSelectedSize] = useState('16px');

  const fonts = [
    { name: 'Clarika', value: 'Clarika, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: '"Times New Roman", serif' },
    { name: 'Courier New', value: '"Courier New", monospace' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
  ];

  const sizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];

  const highlightColors = [
    { name: 'Yellow', color: '#fef08a' },
    { name: 'Green', color: '#bbf7d0' },
    { name: 'Blue', color: '#bfdbfe' },
    { name: 'Pink', color: '#fbcfe8' },
    { name: 'Orange', color: '#fed7aa' },
    { name: 'Purple', color: '#e9d5ff' },
  ];

  const textColors = [
    '#000000', '#7C77F4', '#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'
  ];

  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      const html = convertMarkdownToHtml(value);
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
    }
  }, [value]);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.toString().trim()) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setToolbarPosition({
          top: rect.top - 60,
          left: rect.left + (rect.width / 2) - 200
        });
        setShowToolbar(true);
      } else {
        setShowToolbar(false);
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const convertMarkdownToHtml = (markdown: string): string => {
    return markdown
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/==(.+?)==/g, '<mark>$1</mark>')
      .replace(/\n/g, '<br>');
  };

  const convertHtmlToMarkdown = (html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    let markdown = temp.innerHTML
      .replace(/<strong><em>(.+?)<\/em><\/strong>/g, '***$1***')
      .replace(/<em><strong>(.+?)<\/strong><\/em>/g, '***$1***')
      .replace(/<strong>(.+?)<\/strong>/g, '**$1**')
      .replace(/<b>(.+?)<\/b>/g, '**$1**')
      .replace(/<em>(.+?)<\/em>/g, '*$1*')
      .replace(/<i>(.+?)<\/i>/g, '*$1*')
      .replace(/<u>(.+?)<\/u>/g, '_$1_')
      .replace(/<mark>(.+?)<\/mark>/g, '==$1==')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<div>/g, '\n')
      .replace(/<\/div>/g, '')
      .replace(/<p>/g, '\n')
      .replace(/<\/p>/g, '\n')
      .replace(/&nbsp;/g, ' ');
    
    return markdown.trim();
  };

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      const markdown = convertHtmlToMarkdown(editorRef.current.innerHTML);
      onChange(markdown);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const applyHighlight = (color: string) => {
    execCommand('hiliteColor', color);
  };

  const applyColor = (color: string) => {
    execCommand('foreColor', color);
  };

  const applyFont = (font: string) => {
    setSelectedFont(font);
    execCommand('fontName', font);
  };

  const applySize = (size: string) => {
    setSelectedSize(size);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size;
      try {
        range.surroundContents(span);
      } catch (e) {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
      }
      selection.removeAllRanges();
    }
    editorRef.current?.focus();
    handleInput();
  };

  const openMathEditor = () => {
    // Create modal for math equation using Desmos
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-background rounded-lg p-6 w-[700px]">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Math Equation Editor</h3>
          <button class="text-muted-foreground hover:text-foreground" onclick="this.closest('.fixed').remove()">×</button>
        </div>
        <div id="calculator" style="width: 650px; height: 450px;"></div>
        <div class="flex justify-end gap-2 mt-4">
          <button class="px-4 py-2 rounded bg-muted hover:bg-muted/80" onclick="this.closest('.fixed').remove()">Cancel</button>
          <button class="px-4 py-2 rounded bg-primary hover:bg-primary/90 text-primary-foreground" onclick="insertMathEquation()">Insert</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Load Desmos script
    const script = document.createElement('script');
    script.src = 'https://www.desmos.com/api/v1.11/calculator.js?apiKey=452753a0558f4a3c97f286efa8700052';
    script.onload = () => {
      // @ts-ignore
      const elt = document.getElementById('calculator');
      // @ts-ignore
      window.calculator = Desmos.GraphingCalculator(elt);
    };
    document.head.appendChild(script);

    // @ts-ignore
    window.insertMathEquation = () => {
      // @ts-ignore
      const state = window.calculator.getState();
      const equation = state.expressions.list[0]?.latex || '';
      if (equation && editorRef.current) {
        const span = document.createElement('span');
        span.className = 'math-equation';
        span.textContent = `[Math: ${equation}]`;
        span.style.backgroundColor = '#f3f4f6';
        span.style.padding = '2px 8px';
        span.style.borderRadius = '4px';
        span.style.fontFamily = 'monospace';
        editorRef.current.appendChild(span);
        handleInput();
      }
      modal.remove();
    };
  };

  return (
    <>
      {/* Floating Toolbar on Selection */}
      {showToolbar && (
        <div
          className="fixed bg-background border border-border rounded-lg shadow-lg p-2 flex items-center gap-1 z-50"
          style={{ top: `${toolbarPosition.top}px`, left: `${toolbarPosition.left}px` }}
        >
          <Select value={selectedFont} onValueChange={applyFont}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <Type className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fonts.map(font => (
                <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSize} onValueChange={applySize}>
            <SelectTrigger className="w-[80px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizes.map(size => (
                <SelectItem key={size} value={size}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button size="sm" variant="ghost" onClick={() => execCommand('bold')} className="h-8 w-8 p-0">
            <Bold className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => execCommand('italic')} className="h-8 w-8 p-0">
            <Italic className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => execCommand('underline')} className="h-8 w-8 p-0">
            <Underline className="w-3 h-3" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Palette className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex gap-1">
                {textColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => applyColor(color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Highlighter className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex gap-1">
                {highlightColors.map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: item.color }}
                    onClick={() => applyHighlight(item.color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button size="sm" variant="ghost" onClick={openMathEditor} className="h-8 w-8 p-0">
            <SquareFunction className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div className="border rounded-md">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className={`min-h-[400px] p-4 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${className}`}
          style={{ whiteSpace: 'pre-wrap' }}
        />
      </div>
    </>
  );
}
