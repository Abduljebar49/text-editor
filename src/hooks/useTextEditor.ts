// src/hooks/useTextEditor.ts
import { useState, useCallback, useRef, useEffect } from 'react';

export const useTextEditor = (initialContent: string = '', readOnly: boolean = false) => {
  const [editorState, setEditorState] = useState({
    content: initialContent,
    title: 'Untitled Document',
    wordCount: initialContent.trim() ? initialContent.trim().split(/\s+/).length : 0,
    characterCount: initialContent.length,
    hasUnsavedChanges: false,
  });

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    h1: false,
    h2: false,
    h3: false,
  });

  const [isLinkActive, setIsLinkActive] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const previousInitialContentRef = useRef<string>(initialContent);

  // Update active formats based on current selection
  const updateActiveFormats = useCallback(() => {
    if (readOnly || !document.queryCommandSupported) return;

    setActiveFormats(prev => ({
      ...prev,
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      justifyFull: document.queryCommandState('justifyFull'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    }));

    // Check for heading formats
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const node = selection.getRangeAt(0).startContainer.parentElement;
      const tagName = node?.tagName?.toLowerCase();
      
      setActiveFormats(prev => ({
        ...prev,
        h1: tagName === 'h1',
        h2: tagName === 'h2',
        h3: tagName === 'h3',
      }));

      // Check for links
      const linkElement = node?.closest('a');
      setIsLinkActive(!!linkElement);
    }
  }, [readOnly]);

  // Initialize or update editor content when initialContent changes
  useEffect(() => {
    if (initialContent !== previousInitialContentRef.current) {
      if (editorRef.current) {
        editorRef.current.innerHTML = initialContent;
      }
      
      setEditorState(prev => ({
        ...prev,
        content: initialContent,
        wordCount: initialContent.trim() ? initialContent.trim().split(/\s+/).length : 0,
        characterCount: initialContent.length,
        hasUnsavedChanges: readOnly ? false : prev.hasUnsavedChanges,
      }));
      
      previousInitialContentRef.current = initialContent;
    }
  }, [initialContent, readOnly]);

  // Set up event listeners for selection changes
  useEffect(() => {
    if (readOnly) return;

    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [readOnly, updateActiveFormats]);

  // Separate effect for initial setup
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && initialContent) {
      editorRef.current.innerHTML = initialContent;
    }
  }, []);

  const updateContent = useCallback((content: string) => {
    if (readOnly) return;
    
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const characterCount = content.length;

    setEditorState(prev => ({
      ...prev,
      content,
      wordCount,
      characterCount,
      hasUnsavedChanges: true,
    }));

    previousInitialContentRef.current = content;
  }, [readOnly]);

  const updateTitle = useCallback((title: string) => {
    if (readOnly) return;
    
    setEditorState(prev => ({
      ...prev,
      title,
      hasUnsavedChanges: true,
    }));
  }, [readOnly]);

  const executeCommand = useCallback((command: string, value?: string) => {
    if (readOnly || !editorRef.current) return;
    
    // Save current selection
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    
    // For toggle commands, use queryCommandState to determine if we should remove formatting
    if (command === 'bold' || command === 'italic' || command === 'underline' || command === 'strikeThrough') {
      const isActive = document.queryCommandState(command);
      if (isActive) {
        // Remove formatting
        document.execCommand(command, false, undefined);
      } else {
        // Apply formatting
        document.execCommand(command, false, value);
      }
    } else {
      // Execute normal command
      document.execCommand(command, false, value);
    }
    
    // Update content state
    updateContent(editorRef.current.innerHTML);
    
    // Update active formats
    updateActiveFormats();
    
    // Restore selection
    if (range && selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
  }, [updateContent, updateActiveFormats, readOnly]);

  const getValidationResult = useCallback((): { success: boolean; data?: any; error?: string } => {
    try {
      const data = ({
        title: editorState.title,
        content: editorState.content,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wordCount: editorState.wordCount,
          characterCount: editorState.characterCount,
        },
      });
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Validation failed' };
    }
  }, [editorState]);

  const exportToHTML = useCallback(
    (options = { includeStyles: true, includeMeta: true }) => {
      const validation = getValidationResult();
      if (!validation.success) {
        throw new Error(validation.error);
      }

      const { data } = validation;

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data?.title}</title>`;

      if (options.includeStyles) {
        html += `
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      line-height: 1.6; 
      margin: 40px; 
      max-width: 800px; 
      background: #f8fafc;
    }
    .editor-content { 
      border: 1px solid #e2e8f0; 
      padding: 24px; 
      border-radius: 12px; 
      background: white;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }
    .readonly-content {
      background: #f9f9f9;
      cursor: default;
      user-select: text;
    }
  </style>`;
      }

      html += `\n</head>\n<body>`;

      if (options.includeMeta) {
        html += `
  <div class="document-meta">
    <h1>${data?.title}</h1>
    <p><small>Created: ${new Date(data?.metadata!.createdAt ?? "").toLocaleString()} | 
    Words: ${data?.metadata!.wordCount} | 
    Characters: ${data?.metadata!.characterCount}</small></p>
    <hr>
  </div>`;
      }

      html += `
  <div class="${options.includeStyles ? 'readonly-content' : ''}">
    ${data?.content}
  </div>
</body>
</html>`;

      return html;
    },
    [getValidationResult]
  );

  const clearEditor = useCallback(() => {
    if (readOnly) return;
    
    setEditorState({
      content: '',
      title: 'Untitled Document',
      wordCount: 0,
      characterCount: 0,
      hasUnsavedChanges: false,
    });
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    previousInitialContentRef.current = '';
    setActiveFormats({
      bold: false,
      italic: false,
      underline: false,
      strikeThrough: false,
      justifyLeft: false,
      justifyCenter: false,
      justifyRight: false,
      justifyFull: false,
      insertUnorderedList: false,
      insertOrderedList: false,
      h1: false,
      h2: false,
      h3: false,
    });
  }, [readOnly]);

  const resetToInitial = useCallback(() => {
    if (readOnly) return;
    
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
    }
    setEditorState(prev => ({
      ...prev,
      content: initialContent,
      wordCount: initialContent.trim() ? initialContent.trim().split(/\s+/).length : 0,
      characterCount: initialContent.length,
      hasUnsavedChanges: false,
    }));
    previousInitialContentRef.current = initialContent;
  }, [initialContent, readOnly]);

  return {
    editorState,
    editorRef,
    updateContent,
    updateTitle,
    executeCommand,
    getValidationResult,
    exportToHTML,
    clearEditor,
    resetToInitial,
    activeFormats,
    isLinkActive,
  };
};