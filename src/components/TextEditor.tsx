// src/components/TextEditor.tsx
import React, { useState, useEffect } from "react";
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
  const [showValidation, setShowValidation] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use the custom hook
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

  // Destructure state from hook
  const { content, title, wordCount, characterCount, hasUnsavedChanges } = editorState;

  // Initialize editor content when initialContent changes
  useEffect(() => {
    if (editorRef.current && initialContent && !isInitialized) {
      editorRef.current.innerHTML = initialContent;
      setIsInitialized(true);
    }
  }, [initialContent, isInitialized]);

  // Reset initialization when initialContent becomes empty (for clearing)
  useEffect(() => {
    if (!initialContent) {
      setIsInitialized(false);
    }
  }, [initialContent]);

  // Handle content changes
  const handleContentUpdate = (newContent: string) => {
    updateContent(newContent);

    // Call onChange callback if provided
    if (onChange) {
      const html = exportToHTML();
      onChange(newContent, html);
    }
  };

  // Handle title changes
  const handleTitleChange = (newTitle: string) => {
    updateTitle(newTitle);

    // Call onChange callback if provided (with current content)
    if (onChange) {
      const html = exportToHTML();
      onChange(content, html, newTitle);
    }
  };

  const handleSave = () => {
    const validation = getValidationResult();
    if (validation.success) {
      const html = exportToHTML();
      onSave?.(content, html);
    } else {
      setShowValidation(true);
      setTimeout(() => setShowValidation(false), 3000);
    }
  };

  const handleExport = () => {
    try {
      const html = exportToHTML();
      onExport?.(html);

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_")}.html`;
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
  };

  const handleClear = () => {
    if (
      confirm(
        "Are you sure you want to clear the editor? All unsaved changes will be lost."
      )
    ) {
      clearEditor();
      setIsInitialized(false);
      // Call onChange with empty content after clearing
      if (onChange) {
        onChange("", "");
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header Section - Conditionally rendered */}
      {showSaveTitle && (
        <div className="p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <input
            type="text"
            className="w-full bg-transparent text-2xl font-bold text-gray-800 placeholder-gray-500 outline-none border-none focus:ring-0"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Document Title"
          />
          {showValidation && (
            <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-pulse">
              Please add content before saving
            </div>
          )}
        </div>
      )}

      {/* Toolbar - Conditionally rendered */}
      <Toolbar
        onSave={handleSave}
        onExport={handleExport}
        onClear={handleClear}
        showButtons={showButtons}
        executeCommand={executeCommand}
      />

      {/* Editor Content */}
      <div
        ref={editorRef}
        className={`min-h-[500px] p-8 prose max-w-none border-none outline-none resize-none text-gray-700 leading-relaxed bg-white focus:bg-gray-50 transition-colors duration-200 ${
          showSaveTitle ? "rounded-t-xl" : ""
        } ${showButtons ? "border-t-0" : ""}`}
        contentEditable
        onInput={(e) => handleContentUpdate(e.currentTarget.innerHTML)}
        onFocus={(e) => e.currentTarget.classList.add("bg-gray-50")}
        onBlur={(e) => e.currentTarget.classList.remove("bg-gray-50")}
      />

      {/* Status Bar */}
      {showStatusBar && (
        <StatusBar
          wordCount={wordCount}
          characterCount={characterCount}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      )}
    </div>
  );
};