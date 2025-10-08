export interface TextEditorProps {
  initialContent?: string;
  onSave?: (content: string, html: string) => void;
  onExport?: (html: string) => void;
  onChange?: (content: string, html: string, title?: string) => void; // Add onChange
  showButtons?: boolean; // Add hideToolbar
  showSaveTitle?: boolean; // Add showSaveTitle
  showStatusBar?: boolean; // Add showStatusBar
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