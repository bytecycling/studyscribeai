import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onSave?: () => void;
  onEdit?: () => void;
  onToggleSidebar?: () => void;
  onCancel?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? event.metaKey : event.ctrlKey;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable;

    // Ctrl/Cmd + S - Save
    if (modifier && event.key === 's') {
      event.preventDefault();
      handlers.onSave?.();
      return;
    }

    // Ctrl/Cmd + E - Edit (only if not in input)
    if (modifier && event.key === 'e' && !isInput) {
      event.preventDefault();
      handlers.onEdit?.();
      return;
    }

    // Ctrl/Cmd + B - Toggle sidebar (only if not in input)
    if (modifier && event.key === 'b' && !isInput) {
      event.preventDefault();
      handlers.onToggleSidebar?.();
      return;
    }

    // Escape - Cancel editing
    if (event.key === 'Escape') {
      handlers.onCancel?.();
      return;
    }
  }, [handlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
