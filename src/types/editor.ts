// src/types/editor.ts
export interface TextEditorProps {
  initialContent?: string;
  onSave?: (content: string, html: string) => void;
  onExport?: (html: string) => void;
  onChange?: (content: string, html: string, title?: string) => void;
  showButtons?: boolean;
  showSaveTitle?: boolean;
  showStatusBar?: boolean;
  // Add these new props for image handling
  onImageUpload?: (file: File) => Promise<string>; // Upload handler returns URL
  imageUploadEndpoint?: string; // Optional: API endpoint for uploads
  allowedImageTypes?: string[]; // Default: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  maxImageSize?: number; // Default: 5MB in bytes
  height?: string | number;
  readOnly?: boolean;
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
  pendingImages: Array<{ // Track images that need uploading
    id: string;
    file: File;
    placeholderUrl: string;
    status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  }>;
}

// Image data interface for export
export interface ImageData {
  originalUrl: string; // Original src (could be data URL or placeholder)
  uploadedUrl?: string; // Final uploaded URL
  alt?: string;
  fileName?: string;
  size?: number;
  type?: string;
}