// src/components/TextEditor.tsx
import React, { useState, useCallback, useEffect } from "react";
import { Toolbar } from "./Toolbar";
import { StatusBar } from "./StatusBar";
import { useTextEditor } from "../hooks/useTextEditor";
import type { TextEditorProps } from "../types/editor";

export const TextEditor: React.FC<TextEditorProps> = ({
  initialContent = "",
  onSave,
  onExport,
  onChange,
  showButtons = false,
  showSaveTitle = false,
  showStatusBar = false,
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
  } = useTextEditor(initialContent);

  const [showValidation, setShowValidation] = useState(false);

  // Notify parent component when content or title changes
  useEffect(() => {
    if (onChange) {
      try {
        const html = exportToHTML({ includeStyles: false, includeMeta: false });
        onChange(editorState.content, html, editorState.title);
      } catch (error) {
        // If export fails (e.g., validation error), call onChange with basic HTML wrapper
        const fallbackHtml = `<!DOCTYPE html><html><body>${editorState.content}</body></html>`;
        onChange(editorState.content, fallbackHtml, editorState.title);
      }
    }
  }, [editorState.content, editorState.title, onChange, exportToHTML]);

  const handleSave = useCallback(() => {
    const validation = getValidationResult();
    if (validation.success) {
      const html = exportToHTML();
      onSave?.(editorState.content, html);
    } else {
      setShowValidation(true);
      setTimeout(() => setShowValidation(false), 3000);
    }
  }, [editorState.content, getValidationResult, exportToHTML, onSave]);

  const handleExport = useCallback(() => {
    try {
      const html = exportToHTML();
      onExport?.(html);

      // Create and trigger download
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
  }, [exportToHTML, editorState.title, onExport]);

  const handleClear = useCallback(() => {
    if (
      confirm(
        "Are you sure you want to clear the editor? All unsaved changes will be lost."
      )
    ) {
      clearEditor();
      // onChange will be automatically triggered by the useEffect above
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
      />

      <div
        ref={editorRef}
        className="editor-content min-h-[500px] p-8 border-none outline-none resize-none text-gray-700 leading-relaxed prose max-w-none"
        contentEditable
        onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
        onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
        suppressContentEditableWarning={true}
      />

      {showStatusBar && (
        <StatusBar
          wordCount={editorState.wordCount}
          characterCount={editorState.characterCount}
          hasUnsavedChanges={editorState.hasUnsavedChanges}
        />
      )}
    </div>
  );
};
