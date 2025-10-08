// src/components/TextEditor.tsx
import React, { useState } from 'react';
import { Toolbar } from './Toolbar';
import { StatusBar } from './StatusBar';
import { useTextEditor } from '../hooks/useTextEditor';
import type { TextEditorProps } from '../types/editor';

export const TextEditor: React.FC<TextEditorProps> = ({
  initialContent = '',
  onSave,
  onExport,
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

  const handleSave = () => {
    const validation = getValidationResult();
    if (validation.success) {
      const html = exportToHTML();
      onSave?.(editorState.content, html);
    } else {
      setShowValidation(true);
      setTimeout(() => setShowValidation(false), 3000);
    }
  };

  const handleExport = () => {
    try {
      const html = exportToHTML();
      onExport?.(html);

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editorState.title.replace(/\s+/g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the editor? All unsaved changes will be lost.')) {
      clearEditor();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <input
          type="text"
          className="w-full bg-transparent text-2xl font-bold text-gray-800 placeholder-gray-500 outline-none border-none focus:ring-0"
          value={editorState.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="Document Title"
        />
        {showValidation && (
          <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-pulse">
            Please add content before saving
          </div>
        )}
      </div>

      {/* Toolbar */}
      <Toolbar
        onCommand={executeCommand}
        onSave={handleSave}
        onExport={handleExport}
        onClear={handleClear}
        hasUnsavedChanges={editorState.hasUnsavedChanges}
      />

      {/* Editor Content */}
      <div
        ref={editorRef}
        className="min-h-[500px] p-8 prose max-w-none border-none outline-none resize-none text-gray-700 leading-relaxed bg-white focus:bg-gray-50 transition-colors duration-200"
        contentEditable
        onInput={(e) => updateContent(e.currentTarget.innerHTML)}
        onFocus={(e) => e.currentTarget.classList.add('bg-gray-50')}
        onBlur={(e) => e.currentTarget.classList.remove('bg-gray-50')}
      />

      {/* Status Bar */}
      <StatusBar
        wordCount={editorState.wordCount}
        characterCount={editorState.characterCount}
        hasUnsavedChanges={editorState.hasUnsavedChanges}
      />
    </div>
  );
};