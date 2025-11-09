import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline, Highlighter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const [highlightColor, setHighlightColor] = useState('#fef08a');

  const highlightColors = [
    { name: 'Yellow', color: '#fef08a' },
    { name: 'Green', color: '#bbf7d0' },
    { name: 'Blue', color: '#bfdbfe' },
    { name: 'Pink', color: '#fbcfe8' },
    { name: 'Orange', color: '#fed7aa' },
    { name: 'Purple', color: '#e9d5ff' },
  ];

  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      // Convert markdown to HTML for display
      const html = convertMarkdownToHtml(value);
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
    }
  }, [value]);

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
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const mark = document.createElement('mark');
      mark.style.backgroundColor = color;
      mark.style.color = '#000';
      try {
        range.surroundContents(mark);
      } catch (e) {
        // If surroundContents fails, use a different approach
        const fragment = range.extractContents();
        mark.appendChild(fragment);
        range.insertNode(mark);
      }
      selection.removeAllRanges();
      editorRef.current?.focus();
      handleInput();
    }
  };

  return (
    <div className="border rounded-md">
      <div className="flex gap-1 p-2 border-b bg-muted/50">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => execCommand('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => execCommand('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => execCommand('underline')}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-2">
              {highlightColors.map((item) => (
                <button
                  key={item.color}
                  type="button"
                  className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: item.color }}
                  onClick={() => applyHighlight(item.color)}
                  title={item.name}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className={`min-h-[400px] p-4 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${className}`}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
}
