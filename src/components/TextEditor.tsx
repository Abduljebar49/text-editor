// src/components/TextEditor.tsx
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Toolbar } from "./Toolbar";
import { StatusBar } from "./StatusBar";
import { useTextEditor } from "../hooks/useTextEditor";
import { Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "../utils";
import debounce from "lodash/debounce";

interface TextEditorProps {
  initialContent?: string;
  onChange?: (content: string, html: string, title?: string) => void;
  onSave?: (content: string, html: string) => void;
  onExport?: (html: string) => void;
  readOnly?: boolean;
  showButtons?: boolean;
  showSaveTitle?: boolean;
  showStatusBar?: boolean;
  height?: string;
  onImageUpload?: (file: File) => Promise<string>;
  imageUploadEndpoint?: string;
  allowedImageTypes?: string[];
  maxImageSize?: number;
  onInit?: (editor: HTMLDivElement) => void;
  debounceDelay?: number;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export interface TextEditorRef {
  getContent: () => string;
  getHTML: () => string;
  getTitle: () => string;
  clear: () => void;
  focus: () => void;
  insertText: (text: string) => void;
  insertHTML: (html: string) => void;
  executeCommand: (command: string, value?: string) => void;
}

export const TextEditor = forwardRef<TextEditorRef, TextEditorProps>(
  (
    {
      initialContent = "",
      onChange,
      onSave,
      onExport,
      readOnly = false,
      showButtons = false,
      showSaveTitle = false,
      showStatusBar = false,
      height = "500px",
      onImageUpload,
      imageUploadEndpoint,
      allowedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ],
      maxImageSize = 5 * 1024 * 1024,
      onInit,
      debounceDelay = 300,
      className = "",
      placeholder = "Start typing here...",
      autoFocus = false,
    },
    ref
  ) => {
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

    const fileInputRef = useRef<HTMLInputElement>(null);
    const isInitialized = useRef(false);
    const debouncedOnChangeRef = useRef<ReturnType<typeof debounce> | null>(null);
    const [showValidation, setShowValidation] = useState(false);
    const [validationMessage, setValidationMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getContent: () => editorState.content,
      getHTML: () => exportToHTML(),
      getTitle: () => editorState.title,
      clear: clearEditor,
      focus: () => {
        if (editorRef.current) {
          editorRef.current.focus();
          // Place cursor at the end
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      },
      insertText: (text: string) => {
        if (editorRef.current) {
          document.execCommand("insertText", false, text);
          updateContent(editorRef.current.innerHTML);
        }
      },
      insertHTML: (html: string) => {
        if (editorRef.current) {
          document.execCommand("insertHTML", false, html);
          updateContent(editorRef.current.innerHTML);
        }
      },
      executeCommand: (command: string, value?: string) => {
        executeCommand(command, value);
      },
    }));

    /* -------------------- onInit -------------------- */
    useEffect(() => {
      if (onInit && editorRef.current && !isInitialized.current) {
        onInit(editorRef.current);
        isInitialized.current = true;
      }
    }, [onInit, editorRef]);

    /* -------------------- Auto Focus -------------------- */
    useEffect(() => {
      if (autoFocus && editorRef.current && !readOnly) {
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus();
            // Place cursor at the end
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }, 100);
      }
    }, [autoFocus, readOnly, editorRef]);

    /* -------------------- Debounced onChange -------------------- */
    useEffect(() => {
      if (!onChange) return;

      debouncedOnChangeRef.current = debounce(
        (content: string, html: string, title?: string) => {
          onChange(content, html, title);
        },
        debounceDelay
      );

      return () => {
        if (debouncedOnChangeRef.current) {
          debouncedOnChangeRef.current.cancel();
        }
      };
    }, [onChange, debounceDelay]);

    /* -------------------- Content Change Notify -------------------- */
    useEffect(() => {
      if (!onChange || !editorState.content && !editorState.content.trim()) return;

      const html =
        (() => {
          try {
            return exportToHTML({
              includeStyles: false,
              includeMeta: false,
            });
          } catch {
            return `<!DOCTYPE html><html><body>${editorState.content}</body></html>`;
          }
        })();

      if (debounceDelay > 0 && debouncedOnChangeRef.current) {
        debouncedOnChangeRef.current(
          editorState.content,
          html,
          editorState.title
        );
      } else {
        onChange(editorState.content, html, editorState.title);
      }
    }, [
      editorState.content,
      editorState.title,
      onChange,
      exportToHTML,
      debounceDelay,
    ]);

    /* -------------------- Handlers -------------------- */
    const handleSave = useCallback(async () => {
      // Flush any pending debounced changes
      if (debouncedOnChangeRef.current) {
        debouncedOnChangeRef.current.flush?.();
      }

      // Upload pending images first
      if (editorState.pendingImages.length > 0) {
        setIsUploading(true);
        try {
          await uploadPendingImages();
          setValidationMessage("Images uploaded successfully!");
          setTimeout(() => setValidationMessage(""), 3000);
        } catch (error) {
          setValidationMessage("Failed to upload images. Please try again.");
          setShowValidation(true);
          setTimeout(() => {
            setShowValidation(false);
            setValidationMessage("");
          }, 5000);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const validation = getValidationResult();
      if (!validation.success) {
        setValidationMessage(validation.error || "Please fix validation errors before saving.");
        setShowValidation(true);
        setTimeout(() => {
          setShowValidation(false);
          setValidationMessage("");
        }, 3000);
        return;
      }

      try {
        onSave?.(editorState.content, exportToHTML());
        setValidationMessage("Document saved successfully!");
        setShowValidation(true);
        setTimeout(() => {
          setShowValidation(false);
          setValidationMessage("");
        }, 2000);
      } catch (error) {
        setValidationMessage("Failed to save document.");
        setShowValidation(true);
        setTimeout(() => {
          setShowValidation(false);
          setValidationMessage("");
        }, 3000);
      }
    }, [
      editorState,
      uploadPendingImages,
      getValidationResult,
      exportToHTML,
      onSave,
    ]);

    const handleExport = useCallback(async () => {
      // Flush any pending debounced changes
      if (debouncedOnChangeRef.current) {
        debouncedOnChangeRef.current.flush?.();
      }

      // Upload pending images first
      if (editorState.pendingImages.length > 0) {
        setIsUploading(true);
        try {
          await uploadPendingImages();
        } catch (error) {
          console.error("Failed to upload images:", error);
          // Continue with export even if image upload fails
        } finally {
          setIsUploading(false);
        }
      }

      try {
        const html = exportToHTML();
        onExport?.(html);

        // Create and trigger download
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${editorState.title.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_") || "document"}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setValidationMessage("Document exported successfully!");
        setShowValidation(true);
        setTimeout(() => {
          setShowValidation(false);
          setValidationMessage("");
        }, 2000);
      } catch (error) {
        setValidationMessage("Failed to export document.");
        setShowValidation(true);
        setTimeout(() => {
          setShowValidation(false);
          setValidationMessage("");
        }, 3000);
      }
    }, [editorState, uploadPendingImages, exportToHTML, onExport]);

    const handleContentChange = useCallback(
      (html: string) => {
        updateContent(html);
      },
      [updateContent]
    );

    const handleFileSelect = async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (!e.target.files || readOnly) return;

      const files = Array.from(e.target.files);
      let uploadedCount = 0;
      const totalFiles = files.length;

      for (const file of files) {
        try {
          await insertImage(file);
          uploadedCount++;
          setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
        } catch (error) {
          console.error("Failed to insert image:", error);
        }
      }

      setUploadProgress(0);
      e.target.value = "";
    };

    const handleEditorClick = useCallback(() => {
      if (readOnly) return;
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, [readOnly, editorRef]);

    const handleEditorKeyDown = useCallback((e: React.KeyboardEvent) => {
      // Handle keyboard shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && e.shiftKey) {
        e.preventDefault();
        clearEditor();
      }
    }, [handleSave, handleExport, clearEditor]);

    /* -------------------- Render -------------------- */
    return (
      <div
        ref={containerRef}
        className={cn(
          "relative w-full bg-white border border-gray-300 rounded-lg overflow-hidden flex flex-col",
          readOnly && "pointer-events-none opacity-80",
          className
        )}
        style={{ height }}
      >
        {showSaveTitle && (
          <div className="p-4 md:p-6 border-b bg-gradient-to-r from-gray-50 to-white">
            <input
              className="w-full text-xl md:text-2xl font-bold bg-transparent outline-none placeholder:text-gray-400"
              value={editorState.title}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="Document Title"
              readOnly={readOnly}
              maxLength={100}
            />
            {editorState.title.length >= 90 && (
              <div className="text-xs text-gray-500 text-right mt-1">
                {editorState.title.length}/100 characters
              </div>
            )}
          </div>
        )}

        <Toolbar
          onCommand={executeCommand}
          onSave={handleSave}
          onExport={handleExport}
          showButtons={showButtons}
          onClear={clearEditor}
          hasUnsavedChanges={editorState.hasUnsavedChanges}
          onImageUpload={() => fileInputRef.current?.click()}
          pendingImagesCount={editorState.pendingImages.length}
        />

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={allowedImageTypes.join(",")}
          multiple
          onChange={handleFileSelect}
          disabled={readOnly}
        />

        {/* Validation/Status Messages */}
        {(showValidation || isUploading) && (
          <div className={cn(
            "px-4 py-3 text-sm flex items-center gap-2 transition-all duration-300",
            isUploading 
              ? "bg-blue-50 text-blue-700 border-b border-blue-100" 
              : validationMessage.includes("success")
                ? "bg-green-50 text-green-700 border-b border-green-100"
                : "bg-red-50 text-red-700 border-b border-red-100"
          )}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading images... {uploadProgress > 0 && `${uploadProgress}%`}</span>
              </>
            ) : validationMessage.includes("success") ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>{validationMessage}</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                <span>{validationMessage}</span>
              </>
            )}
          </div>
        )}

        {/* Editor Container */}
        <div
          ref={editorRef}
          className={cn(
            "flex-1 p-4 md:p-6 outline-none overflow-y-auto min-h-[200px] bg-white",
            readOnly 
              ? "cursor-default select-text" 
              : "cursor-text",
            !editorState.content && "relative"
          )}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={handleEditorClick}
          onKeyDown={handleEditorKeyDown}
          data-placeholder={placeholder}
          role="textbox"
          aria-label="Text editor"
          aria-multiline="true"
        >
          {!editorState.content && (
            <div className="absolute top-6 left-6 text-gray-400 pointer-events-none select-none">
              {placeholder}
            </div>
          )}
        </div>

        {/* Pending Images Indicator */}
        {editorState.pendingImages.length > 0 && (
          <div className="px-4 py-3 text-sm text-blue-600 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload size={16} />
              <span>
                {editorState.pendingImages.length} image{editorState.pendingImages.length !== 1 ? 's' : ''} pending upload
              </span>
            </div>
            <button
              onClick={uploadPendingImages}
              disabled={isUploading}
              className="text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload Now'}
            </button>
          </div>
        )}

        {/* Status Bar */}
        {showStatusBar && (
          <StatusBar
            wordCount={editorState.wordCount}
            characterCount={editorState.characterCount}
            hasUnsavedChanges={editorState.hasUnsavedChanges}
            pendingImagesCount={editorState.pendingImages.length}
          />
        )}

        {/* Keyboard Shortcuts Hint */}
        {!readOnly && (
          <div className="hidden md:block absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
            Ctrl+S to save • Ctrl+E to export
          </div>
        )}
      </div>
    );
  }
);

TextEditor.displayName = "TextEditor";

export default TextEditor;