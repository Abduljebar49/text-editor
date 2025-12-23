// src/hooks/useTextEditor.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { EditorContentSchema, type EditorContent } from '../schemas/editor.schema';
import type { TextEditorProps, ImageData } from '../types/editor';

interface UseTextEditorProps {
  initialContent: string;
  onImageUpload?: (file: File) => Promise<string>;
  imageUploadEndpoint?: string;
  allowedImageTypes: string[];
  maxImageSize: number;
}

export const useTextEditor = ({
  initialContent = '',
  onImageUpload,
  imageUploadEndpoint,
  allowedImageTypes,
  maxImageSize,
}: UseTextEditorProps) => {
  const [editorState, setEditorState] = useState({
    content: initialContent,
    title: 'Untitled Document',
    wordCount: initialContent.trim() ? initialContent.trim().split(/\s+/).length : 0,
    characterCount: initialContent.length,
    hasUnsavedChanges: false,
    pendingImages: [] as Array<{
      id: string;
      file: File;
      placeholderUrl: string;
      status: 'pending' | 'uploading' | 'uploaded' | 'failed';
    }>,
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const imageMap = useRef<Map<string, ImageData>>(new Map());

  // Initialize or update editor content when initialContent changes
  useEffect(() => {
    if (editorRef.current && initialContent !== editorState.content) {
      editorRef.current.innerHTML = initialContent;
      
      // Extract existing images from content
      extractImagesFromContent(initialContent);
      
      setEditorState(prev => ({
        ...prev,
        content: initialContent,
        wordCount: initialContent.trim() ? initialContent.trim().split(/\s+/).length : 0,
        characterCount: initialContent.length,
      }));
    }
  }, [initialContent]);

  // Extract images from HTML content
  const extractImagesFromContent = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = doc.querySelectorAll('img');
    
    images.forEach((img, index) => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('data:')) {
        // This is a data URL, mark it for upload
        const id = `image-${Date.now()}-${index}`;
        img.setAttribute('data-image-id', id);
        imageMap.current.set(id, {
          originalUrl: src,
          alt: img.getAttribute('alt') || '',
        });
      } else if (src) {
        // This is already a URL
        const id = `image-${Date.now()}-${index}`;
        img.setAttribute('data-image-id', id);
        imageMap.current.set(id, {
          originalUrl: src,
          uploadedUrl: src,
          alt: img.getAttribute('alt') || '',
        });
      }
    });
  };

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
    if (command === 'insertImage') {
      // This will be handled by the toolbar button
      return;
    }
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  // Handle image file validation
  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
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
  };

  // Insert image into editor
  const insertImage = useCallback(async (file: File, atCursor: boolean = true) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

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
      img.className = 'image-uploading';
      img.setAttribute('data-image-id', imageId);
      img.setAttribute('data-file-name', file.name);
      
      // Insert at cursor position or at the end
      if (atCursor && window.getSelection) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(img);
          
          // Move cursor after the image
          range.setStartAfter(img);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          editorRef.current?.appendChild(img);
        }
      } else {
        editorRef.current?.appendChild(img);
      }

      // Update content
      if (editorRef.current) {
        updateContent(editorRef.current.innerHTML);
      }

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
    };
    
    reader.readAsDataURL(file);
  }, [onImageUpload, imageUploadEndpoint, updateContent, allowedImageTypes, maxImageSize]);

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
        const imgElement:any = editorRef.current?.querySelector(`img[data-image-id="${image.id}"]`);
        if (imgElement) {
          imgElement.src = uploadedUrl;
          imgElement.classList.remove('image-uploading');
          imgElement.classList.add('image-uploaded');
          
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
          imgElement.classList.remove('image-uploading');
          imgElement.classList.add('image-failed');
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
    
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          insertImage(file);
        }
        break;
      }
    }
    
    // Allow normal text paste
    setTimeout(() => {
      if (editorRef.current) {
        updateContent(editorRef.current.innerHTML);
      }
    }, 0);
  }, [insertImage, updateContent]);

  // Handle drop events
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    const files = e.dataTransfer.files;
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        insertImage(file, false);
      }
    }
  }, [insertImage]);

  const getValidationResult = useCallback((): { success: boolean; data?: EditorContent; error?: string } => {
    try {
      // Process content before validation
      let processedContent = editorState.content;
      
      // Replace placeholder images with uploaded URLs
      const images = editorRef.current?.querySelectorAll('img[data-image-id]');
      images?.forEach((img:any) => {
        const imageId = img.getAttribute('data-image-id');
        if (imageId) {
          const imageData = imageMap.current.get(imageId);
          if (imageData?.uploadedUrl) {
            img.src = imageData.uploadedUrl;
          }
        }
      });
      
      if (editorRef.current) {
        processedContent = editorRef.current.innerHTML;
      }

      const data = EditorContentSchema.parse({
        title: editorState.title,
        content: processedContent,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wordCount: editorState.wordCount,
          characterCount: editorState.characterCount,
          images: Array.from(imageMap.current.entries()).map(([id, imgData]) => ({
            id,
            ...imgData,
          })),
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
    img { 
      max-width: 100%; 
      height: auto; 
      border-radius: 8px; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin: 16px 0;
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
    Characters: ${data?.metadata!.characterCount} |
    Images: ${imageMap.current.size}</small></p>
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
      pendingImages: [],
    });
    imageMap.current.clear();
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
    handlePaste,
    handleDrop,
    insertImage,
    uploadPendingImages,
  };
};