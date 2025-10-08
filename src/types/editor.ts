export interface TextEditorProps {
  initialContent?: string;
  onSave?: (content: string, html: string) => void;
  onExport?: (html: string) => void;
  onChange?: (content: string, html: string, title?: string) => void;
  showButtons?: boolean;
  showSaveTitle?: boolean;
  showStatusBar?: boolean;
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