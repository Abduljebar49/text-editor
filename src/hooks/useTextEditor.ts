// src/hooks/useTextEditor.ts
import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTextEditorProps {
  initialContent: string;
  onImageUpload?: (file: File) => Promise<string>;
  imageUploadEndpoint?: string;
  allowedImageTypes: string[];
  maxImageSize: number;
}

interface EditorContent {
  title: string;
  content: string;
  metadata: {
    createdAt: string;
    updatedAt: string;
    wordCount: number;
    characterCount: number;
  };
}

interface PendingImage {
  id: string;
  file: File;
  placeholderUrl: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
}

interface EditorState {
  content: string;
  title: string;
  wordCount: number;
  characterCount: number;
  hasUnsavedChanges: boolean;
  pendingImages: PendingImage[];
}

export const useTextEditor = ({
  initialContent = '',
  onImageUpload,
  imageUploadEndpoint,
  allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxImageSize = 5 * 1024 * 1024,
}: UseTextEditorProps) => {
  const [editorState, setEditorState] = useState<EditorState>({
    content: initialContent,
    title: 'Untitled Document',
    wordCount: initialContent.trim() ? initialContent.trim().split(/\s+/).length : 0,
    characterCount: initialContent.length,
    hasUnsavedChanges: false,
    pendingImages: [],
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const imageMap = useRef<Map<string, any>>(new Map());
  const previousInitialContentRef = useRef<string>(initialContent);
  const isInitialMount = useRef(true);

  // Restore selection after command execution
  const restoreSelection = useCallback(() => {
    if (!editorRef.current) return;

    // Focus the editor
    editorRef.current.focus();

    // Try to restore previous selection or set cursor at the end
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        return; // Selection is already within editor
      }
    }

    // Place cursor at the end of content
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, []);

  // Save current selection
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return null;

    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return null;

    return range.cloneRange();
  }, []);

  // Restore saved selection
  const restoreSavedSelection = useCallback((savedRange: Range | null) => {
    if (!savedRange || !editorRef.current) return;

    editorRef.current.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(savedRange);
  }, []);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && isInitialMount.current) {
      editorRef.current.innerHTML = initialContent || '';
      isInitialMount.current = false;
    }
  }, [initialContent]);

  // Update editor content when initialContent changes externally
  useEffect(() => {
    if (initialContent !== previousInitialContentRef.current && editorRef.current) {
      editorRef.current.innerHTML = initialContent;
      previousInitialContentRef.current = initialContent;

      setEditorState(prev => ({
        ...prev,
        content: initialContent,
        wordCount: initialContent.trim() ? initialContent.trim().split(/\s+/).length : 0,
        characterCount: initialContent.length,
        hasUnsavedChanges: false,
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

    previousInitialContentRef.current = content;
  }, []);

  const updateTitle = useCallback((title: string) => {
    setEditorState(prev => ({
      ...prev,
      title,
      hasUnsavedChanges: true,
    }));
  }, []);

  const executeCommand = useCallback((command: string, value?: string) => {
    if (!editorRef.current) return;

    // Save current selection before focusing
    const savedRange = saveSelection();

    // Focus the editor
    editorRef.current.focus();

    // If no selection was saved, create one at current cursor position or end
    if (!savedRange) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        // No selection, create range at end
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    } else {
      // Restore the saved selection
      restoreSavedSelection(savedRange);
    }

    // Execute the command
    try {
      let success = false;

      if (command === 'formatBlock' && value) {
        // Special handling for formatBlock
        success = document.execCommand('formatBlock', false, `<${value}>`);
      } else if (command === 'createLink' && value) {
        // Special handling for createLink
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          success = document.execCommand('createLink', false, value);
        } else {
          // If no text selected, insert the URL as text
          document.execCommand('insertHTML', false, `<a href="${value}" target="_blank">${value}</a>`);
          success = true;
        }
      } else {
        // Execute other commands normally
        success = document.execCommand(command, false, value);
      }

      if (!success) {
        console.warn(`Command ${command} failed to execute`);
      }

      // Update content after command execution
      setTimeout(() => {
        if (editorRef.current) {
          updateContent(editorRef.current.innerHTML);
        }
      }, 0);

    } catch (error) {
      console.error(`Command ${command} failed:`, error);
    }

    // Keep focus on editor
    editorRef.current.focus();
  }, [updateContent, saveSelection, restoreSavedSelection]);

  // Handle image file validation
  const validateImageFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (!allowedImageTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedImageTypes.join(', ')}`,
      };
    }

    if (file.size > maxImageSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${Math.round(maxImageSize / (1024 * 1024))}MB`,
      };
    }

    return { valid: true };
  }, [allowedImageTypes, maxImageSize]);

  // Insert image into editor
  const insertImage = useCallback(async (file: File, atCursor: boolean = true) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    if (!editorRef.current) return;

    // Create a unique ID for this image
    const imageId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create a data URL for the image (placeholder)
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      // Store image data
      imageMap.current.set(imageId, {
        originalUrl: dataUrl,
        fileName: file.name,
        size: file.size,
        type: file.type,
      });

      // Create img element
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = file.name;
      img.className = 'max-w-full h-auto border rounded';
      img.setAttribute('data-image-id', imageId);
      img.setAttribute('data-file-name', file.name);
      img.style.maxWidth = '100%';
      img.style.height = 'auto';

      // Save selection before inserting
      const savedRange = saveSelection();

      // Insert at cursor position or at the end
      if (atCursor && savedRange) {
        savedRange.deleteContents();
        savedRange.insertNode(img);

        // Move cursor after the image
        const newRange = document.createRange();
        newRange.setStartAfter(img);
        newRange.collapse(true);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(newRange);
      } else {
        editorRef.current?.appendChild(img);
      }

      // Update content
      if (editorRef.current)
        updateContent(editorRef?.current?.innerHTML);

      // Add to pending images if upload handler is provided
      if (onImageUpload || imageUploadEndpoint) {
        setEditorState(prev => ({
          ...prev,
          pendingImages: [
            ...prev.pendingImages,
            {
              id: imageId,
              file,
              placeholderUrl: dataUrl,
              status: 'pending',
            },
          ],
        }));
      }

      // Restore focus
      editorRef.current?.focus();
    };

    reader.readAsDataURL(file);
  }, [validateImageFile, updateContent, onImageUpload, imageUploadEndpoint, saveSelection]);

  // Upload pending images
  const uploadPendingImages = useCallback(async () => {
    if (!onImageUpload && !imageUploadEndpoint) {
      return; // No upload handler provided
    }

    const pending = editorState.pendingImages.filter(img => img.status === 'pending');
    if (pending.length === 0) return;

    for (const image of pending) {
      try {
        setEditorState(prev => ({
          ...prev,
          pendingImages: prev.pendingImages.map(img =>
            img.id === image.id ? { ...img, status: 'uploading' } : img
          ),
        }));

        let uploadedUrl: string;

        if (onImageUpload) {
          // Use custom upload handler
          uploadedUrl = await onImageUpload(image.file);
        } else if (imageUploadEndpoint) {
          // Use default upload to endpoint
          const formData = new FormData();
          formData.append('image', image.file);

          const response = await fetch(imageUploadEndpoint, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          uploadedUrl = result.url || result.imageUrl || result.data;
        } else {
          throw new Error('No upload method provided');
        }

        // Update the image in the editor with the uploaded URL
        const imgElement = editorRef.current?.querySelector(`img[data-image-id="${image.id}"]`) as HTMLImageElement;
        if (imgElement) {
          imgElement.src = uploadedUrl;
          imgElement.classList.add('uploaded');

          // Update image map
          const imageData = imageMap.current.get(image.id);
          if (imageData) {
            imageMap.current.set(image.id, {
              ...imageData,
              uploadedUrl,
            });
          }
        }

        // Update pending images state
        setEditorState(prev => ({
          ...prev,
          pendingImages: prev.pendingImages.map(img =>
            img.id === image.id ? { ...img, status: 'uploaded' } : img
          ),
        }));

      } catch (error) {
        console.error('Image upload failed:', error);

        // Mark as failed
        const imgElement = editorRef.current?.querySelector(`img[data-image-id="${image.id}"]`);
        if (imgElement) {
          imgElement.classList.add('failed');
        }

        setEditorState(prev => ({
          ...prev,
          pendingImages: prev.pendingImages.map(img =>
            img.id === image.id ? { ...img, status: 'failed' } : img
          ),
        }));
      }
    }

    // Update content after all uploads
    if (editorRef.current) {
      updateContent(editorRef.current.innerHTML);
    }
  }, [editorState.pendingImages, onImageUpload, imageUploadEndpoint, updateContent]);

  // Handle paste events
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let hasImage = false;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          hasImage = true;
          insertImage(file);
        }
        break;
      }
    }

    // If no image was pasted, allow normal text paste
    if (!hasImage) {
      // Use setTimeout to let the paste happen naturally, then update content
      setTimeout(() => {
        if (editorRef.current) {
          updateContent(editorRef.current.innerHTML);
        }
      }, 0);
    }
  }, [insertImage, updateContent]);

  // Handle drop events
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    const files = Array.from(e.dataTransfer.files);
    let hasImages = false;

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        hasImages = true;
        insertImage(file, false);
      }
    }

    if (!hasImages && editorRef.current) {
      // Handle text drop
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          // Text will be dropped by browser, update content afterwards
          setTimeout(() => {
            if (editorRef.current) {
              updateContent(editorRef.current.innerHTML);
            }
          }, 0);
        }
      }
    }
  }, [insertImage, updateContent]);

  const getValidationResult = useCallback((): { success: boolean; data?: EditorContent; error?: string } => {
    try {
      const content = editorRef.current?.innerHTML || editorState.content;
      const data: EditorContent = {
        title: editorState.title,
        content,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wordCount: editorState.wordCount,
          characterCount: editorState.characterCount,
        },
      };
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
  <title>${data?.title || 'Document'}</title>`;

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
    img { 
      max-width: 100%; 
      height: auto; 
      border-radius: 8px; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin: 16px 0;
    }
    h1 { font-size: 2em; margin: 0.67em 0; }
    h2 { font-size: 1.5em; margin: 0.75em 0; }
    p { margin: 1em 0; }
    ul, ol { margin: 1em 0; padding-left: 2em; }
    a { color: #2563eb; text-decoration: underline; }
    .image-uploading { opacity: 0.7; }
    .image-failed { border: 2px solid #ef4444; }
  </style>`;
      }

      html += `\n</head>\n<body>`;

      if (options.includeMeta && data) {
        html += `
  <div class="document-meta">
    <h1>${data.title}</h1>
    <p><small>Created: ${new Date(data.metadata.createdAt).toLocaleString()} | 
    Words: ${data.metadata.wordCount} | 
    Characters: ${data.metadata.characterCount}</small></p>
    <hr>
  </div>`;
      }

      html += `
  <div class="${options.includeStyles ? 'readonly-content' : ''}">
    ${data?.content || ''}
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
      pendingImages: [],
    });
    imageMap.current.clear();
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      restoreSelection();
    }
    previousInitialContentRef.current = '';
  }, [restoreSelection]);

  return {
    editorState,
    editorRef,
    updateContent,
    updateTitle,
    executeCommand,
    getValidationResult,
    exportToHTML,
    clearEditor,
    handlePaste,
    handleDrop,
    insertImage,
    uploadPendingImages,
  };
};