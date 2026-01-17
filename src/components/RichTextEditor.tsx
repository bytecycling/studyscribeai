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
  const isInitializedRef = useRef(false);
  const [selectedFont, setSelectedFont] = useState('Arial, sans-serif');
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
    { name: 'Black', color: '#000000' },
    { name: 'Purple', color: '#7C77F4' },
    { name: 'Red', color: '#EF4444' },
    { name: 'Green', color: '#10B981' },
    { name: 'Blue', color: '#3B82F6' },
    { name: 'Orange', color: '#F59E0B' },
    { name: 'Violet', color: '#8B5CF6' },
  ];

  // Convert markdown to HTML for WYSIWYG display
  const markdownToHtml = useCallback((markdown: string): string => {
    if (!markdown) return '<p><br></p>';
    
    let html = markdown;
    
    // Process line by line for block elements
    const lines = html.split('\n');
    const processedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Horizontal rules
      if (/^---+$/.test(line.trim())) {
        processedLines.push('<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 1.5rem 0;">');
        continue;
      }
      
      // Headers - convert # to actual styled headings
      if (/^### (.+)$/.test(line)) {
        const content = line.replace(/^### /, '');
        processedLines.push(`<h3 style="font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; color: inherit;">${processInlineStyles(content)}</h3>`);
        continue;
      }
      if (/^## (.+)$/.test(line)) {
        const content = line.replace(/^## /, '');
        processedLines.push(`<h2 style="font-size: 1.5rem; font-weight: 700; margin: 1.25rem 0 0.75rem; color: inherit;">${processInlineStyles(content)}</h2>`);
        continue;
      }
      if (/^# (.+)$/.test(line)) {
        const content = line.replace(/^# /, '');
        processedLines.push(`<h1 style="font-size: 2rem; font-weight: 700; margin: 0 0 1rem; color: inherit;">${processInlineStyles(content)}</h1>`);
        continue;
      }
      
      // Blockquotes
      if (/^> (.+)$/.test(line)) {
        const content = line.replace(/^> /, '');
        processedLines.push(`<blockquote style="border-left: 4px solid #7C77F4; padding-left: 1rem; margin: 1rem 0; font-style: italic; color: #6b7280;">${processInlineStyles(content)}</blockquote>`);
        continue;
      }
      
      // Bullet lists
      if (/^[-*] (.+)$/.test(line)) {
        const content = line.replace(/^[-*] /, '');
        processedLines.push(`<div style="display: flex; margin: 0.25rem 0;"><span style="margin-right: 0.5rem; margin-left: 1.5rem;">•</span><span>${processInlineStyles(content)}</span></div>`);
        continue;
      }
      
      // Numbered lists
      if (/^\d+\. (.+)$/.test(line)) {
        const match = line.match(/^(\d+)\. (.+)$/);
        if (match) {
          processedLines.push(`<div style="display: flex; margin: 0.25rem 0;"><span style="margin-right: 0.5rem; margin-left: 1.5rem;">${match[1]}.</span><span>${processInlineStyles(match[2])}</span></div>`);
        }
        continue;
      }
      
      // Tables - basic support
      if (line.includes('|') && line.trim().startsWith('|')) {
        // Skip separator rows
        if (/^\|[\s\-:]+\|$/.test(line.trim())) continue;
        
        const cells = line.split('|').filter(c => c.trim());
        const isHeader = i === 0 || (lines[i-1] && /^\|[\s\-:]+\|$/.test(lines[i-1].trim()));
        const cellTag = isHeader ? 'th' : 'td';
        const cellStyle = 'border: 1px solid #e5e7eb; padding: 0.5rem; text-align: left;';
        const cellsHtml = cells.map(c => `<${cellTag} style="${cellStyle}">${processInlineStyles(c.trim())}</${cellTag}>`).join('');
        processedLines.push(`<tr>${cellsHtml}</tr>`);
        continue;
      }
      
      // Empty lines become paragraph breaks
      if (line.trim() === '') {
        processedLines.push('<p style="margin: 0.5rem 0;"><br></p>');
        continue;
      }
      
      // Regular paragraphs
      processedLines.push(`<p style="margin: 0.25rem 0; line-height: 1.75;">${processInlineStyles(line)}</p>`);
    }
    
    // Wrap table rows
    let result = processedLines.join('');
    result = result.replace(/(<tr>.*?<\/tr>)+/gs, (match) => {
      return `<table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">${match}</table>`;
    });
    
    return result || '<p><br></p>';
  }, []);

  // Process inline markdown styles
  const processInlineStyles = (text: string): string => {
    return text
      // LaTeX - preserve as-is for now (will be rendered separately)
      .replace(/\$\$([^$]+)\$\$/g, '<span class="math-block" style="display: block; text-align: center; margin: 1rem 0; font-family: serif; background: #f3f4f6; padding: 0.5rem; border-radius: 0.25rem;">$$$$1$$</span>')
      .replace(/\$([^$]+)\$/g, '<span class="math-inline" style="font-family: serif; background: #f3f4f6; padding: 0.125rem 0.25rem; border-radius: 0.125rem;">$$$1$</span>')
      // Bold + Italic
      .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
      // Bold - make it purple as per design
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #7C77F4; font-weight: 700;">$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Underline
      .replace(/_([^_]+)_/g, '<u>$1</u>')
      // Highlight
      .replace(/==([^=]+)==/g, '<mark style="background-color: #fef08a; padding: 0.125rem 0.25rem; border-radius: 0.25rem;">$1</mark>');
  };

  // Convert HTML back to clean markdown
  const htmlToMarkdown = useCallback((html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Walk through all nodes and convert to markdown
    const walkNodes = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        const childContent = Array.from(el.childNodes).map(walkNodes).join('');
        
        switch (tagName) {
          case 'h1':
            return `# ${childContent}\n`;
          case 'h2':
            return `## ${childContent}\n`;
          case 'h3':
            return `### ${childContent}\n`;
          case 'strong':
          case 'b':
            return `**${childContent}**`;
          case 'em':
          case 'i':
            return `*${childContent}*`;
          case 'u':
            return `_${childContent}_`;
          case 'mark':
            return `==${childContent}==`;
          case 'blockquote':
            return `> ${childContent}\n`;
          case 'hr':
            return '---\n';
          case 'br':
            return '\n';
          case 'p':
            return `${childContent}\n`;
          case 'div':
            // Check if it's a list item
            if (el.querySelector('span')) {
              const bullet = el.children[0]?.textContent?.trim();
              const content = el.children[1]?.textContent || childContent;
              if (bullet === '•') {
                return `- ${content}\n`;
              } else if (/^\d+\.$/.test(bullet || '')) {
                return `${bullet} ${content}\n`;
              }
            }
            return `${childContent}\n`;
          case 'span':
            // Handle math blocks
            if (el.classList.contains('math-block') || el.classList.contains('math-inline')) {
              return el.textContent || '';
            }
            return childContent;
          case 'table':
            return childContent;
          case 'tr':
            const cells = Array.from(el.children).map(c => c.textContent || '').join(' | ');
            return `| ${cells} |\n`;
          case 'td':
          case 'th':
            return childContent;
          default:
            return childContent;
        }
      }
      
      return '';
    };
    
    let markdown = walkNodes(temp);
    
    // Clean up multiple newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
    
    return markdown;
  }, []);

  // Initialize editor with content
  useEffect(() => {
    if (editorRef.current && !isInitializedRef.current) {
      editorRef.current.innerHTML = markdownToHtml(value);
      isInitializedRef.current = true;
    }
  }, [value, markdownToHtml]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const markdown = htmlToMarkdown(editorRef.current.innerHTML);
      onChange(markdown);
    }
  }, [onChange, htmlToMarkdown]);

  // Execute formatting command
  const execCommand = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }, [handleInput]);

  // Apply text formatting
  const applyTextFormat = useCallback((format: 'h1' | 'h2' | 'h3' | 'p') => {
    execCommand('formatBlock', format);
  }, [execCommand]);

  // Apply font family
  const applyFont = useCallback((font: string) => {
    setSelectedFont(font);
    execCommand('fontName', font);
  }, [execCommand]);

  // Apply font size properly without leaving raw HTML
  const applyFontSize = useCallback((size: string) => {
    setSelectedSize(size);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      // Use execCommand for fontSize (1-7 scale) then adjust
      const sizeNum = parseInt(size);
      let fontSizeValue = '3'; // Default
      if (sizeNum <= 12) fontSizeValue = '1';
      else if (sizeNum <= 14) fontSizeValue = '2';
      else if (sizeNum <= 16) fontSizeValue = '3';
      else if (sizeNum <= 18) fontSizeValue = '4';
      else if (sizeNum <= 24) fontSizeValue = '5';
      else if (sizeNum <= 28) fontSizeValue = '6';
      else fontSizeValue = '7';
      
      execCommand('fontSize', fontSizeValue);
      
      // Now convert the font element to proper size
      setTimeout(() => {
        if (editorRef.current) {
          const fonts = editorRef.current.querySelectorAll('font[size]');
          fonts.forEach(font => {
            const span = document.createElement('span');
            span.style.fontSize = size;
            span.innerHTML = font.innerHTML;
            font.parentNode?.replaceChild(span, font);
          });
          handleInput();
        }
      }, 0);
    }
    editorRef.current?.focus();
  }, [execCommand, handleInput]);

  // Apply highlight color
  const applyHighlight = useCallback((color: string) => {
    execCommand('hiliteColor', color);
  }, [execCommand]);

  // Apply text color
  const applyTextColor = useCallback((color: string) => {
    execCommand('foreColor', color);
  }, [execCommand]);

  // Insert math equation
  const insertMathEquation = useCallback(() => {
    const equation = prompt('Enter LaTeX equation (e.g., E = mc^2):');
    if (equation && editorRef.current) {
      const mathSpan = document.createElement('span');
      mathSpan.className = 'math-inline';
      mathSpan.textContent = `$${equation}$`;
      mathSpan.style.fontFamily = 'serif';
      mathSpan.style.backgroundColor = '#f3f4f6';
      mathSpan.style.padding = '0.125rem 0.25rem';
      mathSpan.style.borderRadius = '0.125rem';
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
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
    <div className={`border rounded-lg overflow-hidden bg-background ${className}`}>
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

      {/* Always Visible Toolbar - Google Docs style */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/30 border-b sticky top-0 z-10">
        {/* Text Type */}
        <Select defaultValue="p" onValueChange={(v) => applyTextFormat(v as any)}>
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <SelectValue placeholder="Normal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p">Normal</SelectItem>
            <SelectItem value="h1">Title</SelectItem>
            <SelectItem value="h2">Subtitle</SelectItem>
            <SelectItem value="h3">Heading</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Font Family */}
        <Select value={selectedFont} onValueChange={applyFont}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
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
        <Select value={selectedSize} onValueChange={applyFontSize}>
          <SelectTrigger className="w-[70px] h-8 text-xs">
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
        <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} tooltip="Bold (Ctrl+B)" />
        <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} tooltip="Italic (Ctrl+I)" />
        <ToolbarButton onClick={() => execCommand('underline')} icon={Underline} tooltip="Underline (Ctrl+U)" />
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
                  onClick={() => applyTextColor(item.color)}
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
            <p className="text-xs text-muted-foreground mb-2">Highlight</p>
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
        <ToolbarButton onClick={() => applyTextFormat('h1')} icon={Heading1} tooltip="Title" />
        <ToolbarButton onClick={() => applyTextFormat('h2')} icon={Heading2} tooltip="Subtitle" />
        <ToolbarButton onClick={() => applyTextFormat('h3')} icon={Heading3} tooltip="Heading" />

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

      {/* WYSIWYG Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[400px] p-6 outline-none focus:ring-2 focus:ring-primary/20 overflow-auto"
        style={{ 
          lineHeight: 1.75,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
        suppressContentEditableWarning
      />
    </div>
  );
}
