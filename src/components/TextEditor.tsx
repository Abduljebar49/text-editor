// src/components/TextEditor.tsx
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  forwardRef,
} from "react";
import { Toolbar } from "./Toolbar";
import { StatusBar } from "./StatusBar";
import { useTextEditor } from "../hooks/useTextEditor";
import { Upload } from "lucide-react";
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
}

export const TextEditor = forwardRef<HTMLDivElement, TextEditorProps>(
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
      ],
      maxImageSize = 5 * 1024 * 1024,
      onInit,
      debounceDelay = 300,
    },
    ref
  ) => {
    const {
      editorState,
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

    const internalEditorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isInitialized = useRef(false);
    const debouncedOnChangeRef = useRef<ReturnType<typeof debounce> | null>(null);
    const [showValidation, setShowValidation] = useState(false);

    /* -------------------- Ref Forwarding -------------------- */
    useEffect(() => {
      if (!internalEditorRef.current) return;

      if (typeof ref === "function") {
        ref(internalEditorRef.current);
      } else if (ref) {
        ref.current = internalEditorRef.current;
      }
    }, [ref]);

    /* -------------------- onInit -------------------- */
    useEffect(() => {
      if (onInit && internalEditorRef.current && !isInitialized.current) {
        onInit(internalEditorRef.current);
        isInitialized.current = true;
      }
    }, [onInit]);

    /* -------------------- Debounced onChange -------------------- */
    useEffect(() => {
      if (!onChange) return;

      debouncedOnChangeRef.current = debounce(
        (content: string, html: string, title?: string) => {
          onChange(content, html, title);
        },
        debounceDelay
      );

      return () => debouncedOnChangeRef.current?.cancel();
    }, [onChange, debounceDelay]);

    /* -------------------- Content Change Notify -------------------- */
    useEffect(() => {
      if (!onChange || !editorState.content) return;

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
      debouncedOnChangeRef.current?.flush();

      if (editorState.pendingImages.length > 0) {
        await uploadPendingImages();
      }

      const validation = getValidationResult();
      if (!validation.success) {
        setShowValidation(true);
        setTimeout(() => setShowValidation(false), 3000);
        return;
      }

      onSave?.(editorState.content, exportToHTML());
    }, [
      editorState,
      uploadPendingImages,
      getValidationResult,
      exportToHTML,
      onSave,
    ]);

    const handleExport = useCallback(async () => {
      debouncedOnChangeRef.current?.flush();

      if (editorState.pendingImages.length > 0) {
        await uploadPendingImages();
      }

      const html = exportToHTML();
      onExport?.(html);

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        editorState.title.replace(/\s+/g, "_") || "document.html";
      a.click();
      URL.revokeObjectURL(url);
    }, [editorState, uploadPendingImages, exportToHTML, onExport]);

    const handleContentChange = useCallback(
      (html: string) => updateContent(html),
      [updateContent]
    );

    const handleFileSelect = async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (!e.target.files) return;

      for (const file of Array.from(e.target.files)) {
        await insertImage(file);
      }

      e.target.value = "";
    };

    /* -------------------- Render -------------------- */
    return (
      <div
        className={cn(
          "relative w-full bg-white border border-gray-300 rounded-lg overflow-hidden",
          readOnly && "pointer-events-none opacity-80"
        )}
        style={{ height }}
      >
        {showSaveTitle && (
          <div className="p-6 border-b bg-gray-50">
            <input
              className="w-full text-2xl font-bold bg-transparent outline-none"
              value={editorState.title}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="Document Title"
              readOnly={readOnly}
            />
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
        />

        {showValidation && (
          <div className="px-6 py-2 text-sm text-red-600 bg-red-50">
            Please fix validation errors before saving.
          </div>
        )}

        <div
          ref={internalEditorRef}
          className="p-6 outline-none overflow-y-auto min-h-[200px]"
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={(e) =>
            handleContentChange(e.currentTarget.innerHTML)
          }
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        />

        {editorState.pendingImages.length > 0 && (
          <div className="p-4 text-sm text-blue-600 bg-blue-50 flex gap-2">
            <Upload size={16} />
            {editorState.pendingImages.length} image(s) pending upload
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
  }
);

export default TextEditor;
