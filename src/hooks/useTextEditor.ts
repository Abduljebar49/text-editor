// src/hooks/useTextEditor.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { EditorContentSchema, type EditorContent } from '../schemas/editor.schema';


export const useTextEditor = (initialContent: string = '') => {
  const [editorState, setEditorState] = useState({
    content: initialContent,
    title: 'Untitled Document',
    wordCount: initialContent.trim() ? initialContent.trim().split(/\s+/).length : 0,
    characterCount: initialContent.length,
    hasUnsavedChanges: false,
  });

  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize or update editor content when initialContent changes
  useEffect(() => {
    if (editorRef.current && initialContent !== editorState.content) {
      editorRef.current.innerHTML = initialContent;
      setEditorState(prev => ({
        ...prev,
        content: initialContent,
        wordCount: initialContent.trim() ? initialContent.trim().split(/\s+/).length : 0,
        characterCount: initialContent.length,
      }));
    }
  }, [initialContent]);

  const updateContent = useCallback((content: string) => {
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const characterCount = content.length;

    setEditorState(prev => ({
      ...prev,
      content,
      wordCount,
      characterCount,
      hasUnsavedChanges: true,
    }));
  }, []);

  const updateTitle = useCallback((title: string) => {
    setEditorState(prev => ({
      ...prev,
      title,
      hasUnsavedChanges: true,
    }));
  }, []);

  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const getValidationResult = useCallback((): { success: boolean; data?: EditorContent; error?: string } => {
    try {
      const data = EditorContentSchema.parse({
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
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      margin: 40px; 
      max-width: 800px; 
    }
    .editor-content { 
      border: 1px solid #ddd; 
      padding: 20px; 
      border-radius: 8px; 
      background: white;
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
  <div class="editor-content">
    ${data?.content}
  </div>
</body>
</html>`;

      return html;
    },
    [getValidationResult]
  );

  const clearEditor = useCallback(() => {
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
  }, []);

  return {
    editorState,
    editorRef,
    updateContent,
    updateTitle,
    executeCommand,
    getValidationResult,
    exportToHTML,
    clearEditor,
  };
};
