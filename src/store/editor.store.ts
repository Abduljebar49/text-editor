// src/store/editor.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EditorContentSchema, type EditorContent } from '../schemas/editor.schema';

interface EditorState {
  content: string;
  title: string;
  wordCount: number;
  characterCount: number;
  hasUnsavedChanges: boolean;
  activeFormats: string[];
}

interface EditorActions {
  updateContent: (content: string) => void;
  updateTitle: (title: string) => void;
  setActiveFormats: (formats: string[]) => void;
  clearEditor: () => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  executeCommand: (command: string, value?: string) => void;
  updateActiveFormats: () => void;
  getValidationResult: () => { success: boolean; data?: EditorContent; error?: string };
  exportToHTML: (options?: { includeStyles: boolean; includeMeta: boolean }) => string;
  initializeContent: (content: string) => void;
}

const initialState: EditorState = {
  content: '',
  title: 'Untitled Document',
  wordCount: 0,
  characterCount: 0,
  hasUnsavedChanges: false,
  activeFormats: [],
};

const calculateCounts = (content: string) => ({
  wordCount: content.trim() ? content.trim().split(/\s+/).length : 0,
  characterCount: content.length,
});

export const useEditorStore = create<EditorState & EditorActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Initialize content (similar to your hook's useEffect)
      initializeContent: (content: string) => {
        const currentState = get();
        if (content !== currentState.content) {
          const counts = calculateCounts(content);
          set({
            content,
            ...counts,
          });
        }
      },

      updateContent: (content: string) => {
        const counts = calculateCounts(content);
        set({
          content,
          ...counts,
          hasUnsavedChanges: true,
        });
      },

      updateTitle: (title: string) => {
        set({
          title,
          hasUnsavedChanges: true,
        });
      },

      setActiveFormats: (activeFormats: string[]) => {
        set({ activeFormats });
      },

      clearEditor: () => {
        set({
          ...initialState,
          content: '',
          title: 'Untitled Document',
        });
      },

      setHasUnsavedChanges: (hasUnsavedChanges: boolean) => {
        set({ hasUnsavedChanges });
      },

      executeCommand: (command: string, value?: string) => {
        document.execCommand(command, false, value);
        
        // Focus the editor after command
        const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
        if (editor) {
          editor.focus();
        }
        
        // Update active formats immediately
        setTimeout(() => {
          get().updateActiveFormats();
        }, 10);
      },

      updateActiveFormats: () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          set({ activeFormats: [] });
          return;
        }

        const active: string[] = [];
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        // Get the actual element (handle text nodes)
        const element = container.nodeType === 3 ? container.parentElement : container as Element;
        
        if (!element) {
          set({ activeFormats: [] });
          return;
        }

        // Check inline formatting commands
        const inlineCommands = ['bold', 'italic', 'underline', 'strikeThrough'];
        inlineCommands.forEach((cmd) => {
          if (document.queryCommandState(cmd)) active.push(cmd);
        });

        // Check alignment by inspecting computed styles or parent elements
        const parentElement = element.closest('div, p, h1, h2, h3, h4, h5, h6, li, td');
        if (parentElement) {
          const style = window.getComputedStyle(parentElement);
          const textAlign = style.textAlign;
          
          if (textAlign === 'center') active.push('justifyCenter');
          else if (textAlign === 'right') active.push('justifyRight');
          else if (textAlign === 'left') active.push('justifyLeft');
          else if (textAlign === 'justify') active.push('justifyFull');
        }

        // Check block formatting by tag name
        const blockElement = element.closest('h1, h2, h3, h4, h5, h6, p, blockquote, pre');
        if (blockElement) {
          const tagName = blockElement.tagName.toLowerCase();
          active.push(`formatBlock-${tagName}`);
        }

        // Check list types
        if (element.closest('ul')) active.push('insertUnorderedList');
        if (element.closest('ol')) active.push('insertOrderedList');

        set({ activeFormats: active });
      },

      getValidationResult: () => {
        const state = get();
        try {
          const data = EditorContentSchema.parse({
            title: state.title,
            content: state.content,
            metadata: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              wordCount: state.wordCount,
              characterCount: state.characterCount,
            },
          });
          return { success: true, data };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : 'Validation failed' };
        }
      },

      exportToHTML: (options = { includeStyles: true, includeMeta: true }) => {
        const state = get();
        const validation = state.getValidationResult();
        
        if (!validation.success) {
          throw new Error(validation.error);
        }

        const { data } = validation;

        let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data?.title}</title>`;

        if (options.includeStyles) {
          html += `
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      margin: 40px; 
      max-width: 800px; 
    }
    .editor-content { 
      border: 1px solid #ddd; 
      padding: 20px; 
      border-radius: 8px; 
      background: white;
    }
  </style>`;
        }

        html += `\n</head>\n<body>`;

        if (options.includeMeta) {
          html += `
  <div class="document-meta">
    <h1>${data?.title}</h1>
    <p><small>Created: ${new Date(data?.metadata!.createdAt ?? "").toLocaleString()} | 
    Words: ${data?.metadata!.wordCount} | 
    Characters: ${data?.metadata!.characterCount}</small></p>
    <hr>
  </div>`;
        }

        html += `
  <div class="editor-content">
    ${data?.content}
  </div>
</body>
</html>`;

        return html;
      },
    }),
    {
      name: 'editor-storage',
      partialize: (state) => ({
        content: state.content,
        title: state.title,
        wordCount: state.wordCount,
        characterCount: state.characterCount,
      }),
    }
  )
);