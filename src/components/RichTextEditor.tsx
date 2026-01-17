import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Bold, Italic, Underline, Highlighter, Type, Palette, 
  SquareFunction, Heading1, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Strikethrough, Quote
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function RichTextEditor({ value, onChange, className, onSave, onCancel }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedSize, setSelectedSize] = useState('16px');
  const [selectedTextType, setSelectedTextType] = useState('paragraph');

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
    { name: 'Black', color: '#000000' },
    { name: 'Purple', color: '#7C77F4' },
    { name: 'Red', color: '#EF4444' },
    { name: 'Green', color: '#10B981' },
    { name: 'Blue', color: '#3B82F6' },
    { name: 'Orange', color: '#F59E0B' },
    { name: 'Violet', color: '#8B5CF6' },
  ];

  // Convert markdown to HTML for display
  const convertMarkdownToHtml = useCallback((markdown: string): string => {
    if (!markdown) return '';
    
    let html = markdown
      // Headers - convert to styled divs
      .replace(/^### (.+)$/gm, '<h3 style="font-size: 1.25rem; font-weight: 700; margin: 1.5rem 0 0.75rem;">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size: 1.5rem; font-weight: 700; margin: 2rem 0 1rem;">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="font-size: 2rem; font-weight: 700; margin: 0 0 1.5rem;">$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #7C77F4;">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<u>$1</u>')
      // Highlights
      .replace(/==(.+?)==/g, '<mark style="background-color: #fef08a; padding: 0.125rem 0.25rem; border-radius: 0.25rem;">$1</mark>')
      // Blockquotes
      .replace(/^> (.+)$/gm, '<blockquote style="border-left: 4px solid #7C77F4; padding-left: 1rem; margin: 1rem 0; font-style: italic;">$1</blockquote>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr style="border-top: 2px solid hsl(240 10% 90%); margin: 2rem 0;">')
      // Bullet lists
      .replace(/^- (.+)$/gm, '<li style="margin: 0.5rem 0; margin-left: 1.5rem; list-style-type: disc;">$1</li>')
      // Numbered lists
      .replace(/^\d+\. (.+)$/gm, '<li style="margin: 0.5rem 0; margin-left: 1.5rem; list-style-type: decimal;">$1</li>')
      // Tables - basic support
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(c => c.trim());
        const cellHtml = cells.map(c => `<td style="border: 1px solid hsl(240 10% 90%); padding: 0.5rem;">${c.trim()}</td>`).join('');
        return `<tr>${cellHtml}</tr>`;
      })
      // Line breaks
      .replace(/\n/g, '<br>');

    // Wrap consecutive list items
    html = html
      .replace(/(<li[^>]*>.*?<\/li><br>)+/g, (match) => {
        const items = match.replace(/<br>/g, '');
        return `<ul style="margin: 1rem 0;">${items}</ul>`;
      });

    return html;
  }, []);

  // Convert HTML back to markdown
  const convertHtmlToMarkdown = useCallback((html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    let markdown = temp.innerHTML
      // Headers
      .replace(/<h1[^>]*>(.+?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.+?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.+?)<\/h3>/gi, '### $1\n')
      // Bold and italic
      .replace(/<strong><em>(.+?)<\/em><\/strong>/gi, '***$1***')
      .replace(/<em><strong>(.+?)<\/strong><\/em>/gi, '***$1***')
      .replace(/<strong[^>]*>(.+?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.+?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.+?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.+?)<\/i>/gi, '*$1*')
      .replace(/<u[^>]*>(.+?)<\/u>/gi, '_$1_')
      // Highlights
      .replace(/<mark[^>]*>(.+?)<\/mark>/gi, '==$1==')
      // Blockquotes
      .replace(/<blockquote[^>]*>(.+?)<\/blockquote>/gi, '> $1\n')
      // Horizontal rules
      .replace(/<hr[^>]*>/gi, '---\n')
      // Lists
      .replace(/<li[^>]*>(.+?)<\/li>/gi, '- $1\n')
      .replace(/<ul[^>]*>/gi, '')
      .replace(/<\/ul>/gi, '')
      .replace(/<ol[^>]*>/gi, '')
      .replace(/<\/ol>/gi, '')
      // Line breaks and divs
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<div>/gi, '\n')
      .replace(/<\/div>/gi, '')
      .replace(/<p>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/&nbsp;/gi, ' ')
      // Clean up spans
      .replace(/<span[^>]*>(.+?)<\/span>/gi, '$1')
      // Clean up other tags
      .replace(/<[^>]+>/g, '');
    
    return markdown.trim();
  }, []);

  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      const html = convertMarkdownToHtml(value);
      if (editorRef.current.innerHTML !== html) {
        // Save cursor position
        const selection = window.getSelection();
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        
        editorRef.current.innerHTML = html;
        
        // Restore cursor if possible
        if (range && editorRef.current.contains(range.startContainer)) {
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    }
  }, [value, convertMarkdownToHtml]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      const markdown = convertHtmlToMarkdown(editorRef.current.innerHTML);
      onChange(markdown);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [onChange, convertHtmlToMarkdown]);

  const execCommand = useCallback((command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const applyTextType = useCallback((type: string) => {
    setSelectedTextType(type);
    switch (type) {
      case 'title':
        execCommand('formatBlock', 'h1');
        break;
      case 'subtitle':
        execCommand('formatBlock', 'h2');
        break;
      case 'heading':
        execCommand('formatBlock', 'h3');
        break;
      case 'paragraph':
        execCommand('formatBlock', 'p');
        break;
    }
  }, [execCommand]);

  const applyHighlight = useCallback((color: string) => {
    execCommand('hiliteColor', color);
  }, [execCommand]);

  const applyColor = useCallback((color: string) => {
    execCommand('foreColor', color);
  }, [execCommand]);

  const applyFont = useCallback((font: string) => {
    setSelectedFont(font);
    execCommand('fontName', font);
  }, [execCommand]);

  const applySize = useCallback((size: string) => {
    setSelectedSize(size);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size;
      try {
        range.surroundContents(span);
      } catch {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
      }
      selection.removeAllRanges();
    }
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const insertMathEquation = useCallback(() => {
    // Create modal for math equation using Desmos
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-background rounded-lg p-6 w-[700px]" style="background: white;">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Math Equation Editor</h3>
          <button class="text-muted-foreground hover:text-foreground text-2xl" onclick="this.closest('.fixed').remove()">×</button>
        </div>
        <div id="calculator" style="width: 650px; height: 450px;"></div>
        <div class="flex justify-end gap-2 mt-4">
          <button class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onclick="this.closest('.fixed').remove()">Cancel</button>
          <button class="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white" onclick="window.insertMathEquation()">Insert</button>
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
        // Insert as inline LaTeX
        const mathSpan = document.createElement('span');
        mathSpan.className = 'math-equation';
        mathSpan.textContent = `$${equation}$`;
        mathSpan.style.fontFamily = 'KaTeX_Math, serif';
        mathSpan.style.backgroundColor = '#f3f4f6';
        mathSpan.style.padding = '2px 8px';
        mathSpan.style.borderRadius = '4px';
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(mathSpan);
          range.setStartAfter(mathSpan);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          editorRef.current.appendChild(mathSpan);
        }
        handleInput();
      }
      modal.remove();
    };
  }, [handleInput]);

  const ToolbarButton = ({ onClick, icon: Icon, tooltip }: { onClick: () => void; icon: any; tooltip: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onClick} 
            className="h-8 w-8 p-0 hover:bg-primary/10"
            type="button"
          >
            <Icon className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Save/Cancel Header */}
      {(onSave || onCancel) && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
          <span className="text-sm font-medium text-muted-foreground">Editing Mode</span>
          <div className="flex gap-2">
            {onCancel && (
              <Button size="sm" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {onSave && (
              <Button size="sm" onClick={onSave}>
                Save Changes
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Always Visible Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-background border-b">
        {/* Text Type */}
        <Select value={selectedTextType} onValueChange={applyTextType}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Text type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="subtitle">Subtitle</SelectItem>
            <SelectItem value="heading">Heading</SelectItem>
            <SelectItem value="paragraph">Paragraph</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Font Family */}
        <Select value={selectedFont} onValueChange={applyFont}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
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

        {/* Font Size */}
        <Select value={selectedSize} onValueChange={applySize}>
          <SelectTrigger className="w-[75px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sizes.map(size => (
              <SelectItem key={size} value={size}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Basic Formatting */}
        <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} tooltip="Bold" />
        <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} tooltip="Italic" />
        <ToolbarButton onClick={() => execCommand('underline')} icon={Underline} tooltip="Underline" />
        <ToolbarButton onClick={() => execCommand('strikeThrough')} icon={Strikethrough} tooltip="Strikethrough" />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10">
              <Palette className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <p className="text-xs text-muted-foreground mb-2">Text Color</p>
            <div className="flex gap-1">
              {textColors.map((item) => (
                <button
                  key={item.color}
                  type="button"
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: item.color }}
                  onClick={() => applyColor(item.color)}
                  title={item.name}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10">
              <Highlighter className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <p className="text-xs text-muted-foreground mb-2">Highlight Color</p>
            <div className="flex gap-1">
              {highlightColors.map((item) => (
                <button
                  key={item.color}
                  type="button"
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: item.color }}
                  onClick={() => applyHighlight(item.color)}
                  title={item.name}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headers */}
        <ToolbarButton onClick={() => execCommand('formatBlock', 'h1')} icon={Heading1} tooltip="Title (H1)" />
        <ToolbarButton onClick={() => execCommand('formatBlock', 'h2')} icon={Heading2} tooltip="Subtitle (H2)" />
        <ToolbarButton onClick={() => execCommand('formatBlock', 'h3')} icon={Heading3} tooltip="Heading (H3)" />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={List} tooltip="Bullet List" />
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} tooltip="Numbered List" />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <ToolbarButton onClick={() => execCommand('justifyLeft')} icon={AlignLeft} tooltip="Align Left" />
        <ToolbarButton onClick={() => execCommand('justifyCenter')} icon={AlignCenter} tooltip="Align Center" />
        <ToolbarButton onClick={() => execCommand('justifyRight')} icon={AlignRight} tooltip="Align Right" />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Block Quote */}
        <ToolbarButton onClick={() => execCommand('formatBlock', 'blockquote')} icon={Quote} tooltip="Block Quote" />

        {/* Math Equation */}
        <ToolbarButton onClick={insertMathEquation} icon={SquareFunction} tooltip="Insert Equation" />
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[400px] p-6 outline-none focus:ring-2 focus:ring-primary/20 prose prose-lg max-w-none dark:prose-invert"
        style={{ 
          whiteSpace: 'pre-wrap',
          lineHeight: 1.75
        }}
        suppressContentEditableWarning
      />
    </div>
  );
}
