// src/components/TextEditor.tsx
import React, { useState } from 'react';
import { Toolbar } from './Toolbar';
import { StatusBar } from './StatusBar';
import { useTextEditor } from '../hooks/useEditorHooks';
import type { TextEditorProps } from '../type/editor';


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
  } = useTextEditor(initialContent); // ✅ pass initial content

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
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <input
          type="text"
          className="w-full bg-transparent text-2xl font-bold text-gray-800 outline-none placeholder-gray-400"
          value={editorState.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="Document Title"
        />
        {showValidation && (
          <div className="text-red-600 text-sm mt-2 animate-fadeIn">
            Please add content before saving
          </div>
        )}
      </div>

      <Toolbar
        onCommand={executeCommand}
        onSave={handleSave}
        onExport={handleExport}
        onClear={handleClear}
        hasUnsavedChanges={editorState.hasUnsavedChanges}
      />

      <div
        ref={editorRef}
        className="editor-content min-h-[500px] p-8 border-none outline-none resize-none text-gray-700 leading-relaxed prose max-w-none"
        contentEditable
        onInput={(e) => updateContent(e.currentTarget.innerHTML)}
      />

      <StatusBar
        wordCount={editorState.wordCount}
        characterCount={editorState.characterCount}
        hasUnsavedChanges={editorState.hasUnsavedChanges}
      />
    </div>
  );
};
