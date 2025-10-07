// src/types/editor.ts
export interface TextEditorProps {
  initialContent?: string;
  onSave?: (content: string, html: string) => void;
  onExport?: (html: string) => void;
  className?: string;
}

export interface ToolbarButton {
  command: string;
  value?: string;
  icon: string;
  title: string;
  isActive?: boolean;
}

export interface EditorState {
  content: string;
  title: string;
  wordCount: number;
  characterCount: number;
  hasUnsavedChanges: boolean;
}