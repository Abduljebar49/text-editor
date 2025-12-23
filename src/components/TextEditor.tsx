// src/components/TextEditor.tsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Toolbar } from "./Toolbar";
import { StatusBar } from "./StatusBar";
import { useTextEditor } from "../hooks/useTextEditor";
import type { TextEditorProps } from "../types/editor";
import { ImageIcon, Upload } from "lucide-react";

export const TextEditor: React.FC<TextEditorProps> = ({
  initialContent = "",
  onSave,
  onExport,
  onChange,
  showButtons = false,
  showSaveTitle = false,
  showStatusBar = false,
  // New image-related props
  onImageUpload,
  imageUploadEndpoint,
  allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxImageSize = 5 * 1024 * 1024, // 5MB default
}) => {
  const {
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
  } = useTextEditor({
    initialContent,
    onImageUpload,
    imageUploadEndpoint,
    allowedImageTypes,
    maxImageSize,
  });

  const [showValidation, setShowValidation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify parent component when content or title changes
  useEffect(() => {
    if (onChange) {
      try {
        const html = exportToHTML({ includeStyles: false, includeMeta: false });
        onChange(editorState.content, html, editorState.title);
      } catch (error) {
        const fallbackHtml = `<!DOCTYPE html><html><body>${editorState.content}</body></html>`;
        onChange(editorState.content, fallbackHtml, editorState.title);
      }
    }
  }, [editorState.content, editorState.title, onChange, exportToHTML]);

  const handleSave = useCallback(async () => {
    // First upload any pending images
    if (editorState.pendingImages.length > 0) {
      try {
        await uploadPendingImages();
      } catch (error) {
        alert("Failed to upload some images. Please check and try again.");
        return;
      }
    }

    const validation = getValidationResult();
    if (validation.success) {
      const html = exportToHTML();
      onSave?.(editorState.content, html);
    } else {
      setShowValidation(true);
      setTimeout(() => setShowValidation(false), 3000);
    }
  }, [editorState.content, editorState.pendingImages, getValidationResult, exportToHTML, onSave, uploadPendingImages]);

  const handleExport = useCallback(async () => {
    try {
      // Upload any pending images before export
      if (editorState.pendingImages.length > 0) {
        await uploadPendingImages();
      }

      const html = exportToHTML();
      onExport?.(html);

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        editorState.title.replace(/\s+/g, "_") || "document"
      }.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(
        "Export failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }, [exportToHTML, editorState.title, editorState.pendingImages, onExport, uploadPendingImages]);

  const handleClear = useCallback(() => {
    if (
      confirm(
        "Are you sure you want to clear the editor? All unsaved changes will be lost."
      )
    ) {
      clearEditor();
    }
  }, [clearEditor]);

  const handleContentChange = useCallback(
    (html: string) => {
      updateContent(html);
    },
    [updateContent]
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      updateTitle(title);
    },
    [updateTitle]
  );

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      await insertImage(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {showSaveTitle && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <input
            type="text"
            className="w-full bg-transparent text-2xl font-bold text-gray-800 outline-none placeholder-gray-400"
            value={editorState.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Document Title"
          />
          {showValidation && (
            <div className="text-red-600 text-sm mt-2 animate-fadeIn">
              Please add content before saving
            </div>
          )}
        </div>
      )}

      <Toolbar
        onCommand={executeCommand}
        onSave={handleSave}
        onExport={handleExport}
        showButtons={showButtons}
        onClear={handleClear}
        hasUnsavedChanges={editorState.hasUnsavedChanges}
        onImageUpload={handleImageUploadClick}
        pendingImagesCount={editorState.pendingImages.length}
      />

      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={allowedImageTypes.join(',')}
        multiple
        onChange={handleFileSelect}
      />

      {/* Updated editor content with Tailwind classes */}
      <div
        ref={editorRef}
        className="min-h-[500px] p-8 border-none outline-none resize-none text-gray-700 leading-relaxed prose max-w-none
                   /* Heading styles */
                   [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:text-gray-800 [&_h1]:border-b [&_h1]:pb-2
                   [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:text-gray-800
                   [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-gray-800
                   /* Paragraph styles */
                   [&_p]:mb-4 [&_p]:text-gray-700 [&_p]:leading-relaxed
                   /* List styles */
                   [&_ul]:list-disc [&_ul]:list-inside [&_ul]:mb-4 [&_ul]:ml-4 [&_ul]:space-y-1
                   [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-4 [&_ol]:ml-4 [&_ol]:space-y-1
                   [&_li]:mb-1
                   /* Link styles */
                   [&_a]:text-blue-600 [&_a]:hover:text-blue-800 [&_a]:underline [&_a]:transition-colors
                   /* Blockquote styles */
                   [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-4
                   /* Code styles */
                   [&_code]:bg-gray-100 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
                   [&_pre]:bg-gray-800 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4
                   [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0
                   /* Image styles */
                   [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:shadow-md [&_img]:my-4
                   [&_.image-uploading]:opacity-50 [&_.image-uploading]:animate-pulse
                   [&_.image-failed]:border-2 [&_.image-failed]:border-red-500"
        contentEditable
        onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
        onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()} // Allow drop
        suppressContentEditableWarning={true}
      />

      {/* Pending images notification */}
      {editorState.pendingImages.length > 0 && (
        <div className="px-8 pb-4">
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            <Upload size={16} />
            <span>
              {editorState.pendingImages.length} image(s) pending upload. 
              They will be uploaded when you save or export.
            </span>
          </div>
        </div>
      )}

      {showStatusBar && (
        <StatusBar
          wordCount={editorState.wordCount}
          characterCount={editorState.characterCount}
          hasUnsavedChanges={editorState.hasUnsavedChanges}
          pendingImagesCount={editorState.pendingImages.length}
        />
      )}
    </div>
  );
};