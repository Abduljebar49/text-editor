
import { useCallback, useRef, useState } from 'react';
import { TextEditor } from './components/TextEditor';

// Mock functions to match user snippet
const setValue = (name: string, value: any, _options?: any) => {
  console.log(`setValue called for ${name} with value:`, value);
};

const setTextContent = (content: { markdown: string; html: string }) => {
  console.log('setTextContent called with:', content);
};

const autoSave = (_markdown: string, _html: string) => {
  console.log('autoSave called with markdown and html');
};

export const Reproduction = () => {
  const currentTextContentRef = useRef({ markdown: '', html: '' });
  const [id] = useState('test-id');
  const stableInitialContent = '<h1>Test</h1>';

  const handleTextEditorChange = useCallback(
    (markdown: string, html?: string) => {
      // Update our stable ref
      currentTextContentRef.current = {
        markdown,
        html: html ?? "",
      };

      // Also update store (won't trigger re-render now because we don't subscribe to state)
      setTextContent({
        markdown,
        html: html ?? "",
      });

      setValue("textContent.content", markdown, { shouldDirty: true });
      setValue("textContent.htmlContent", html ?? "", {
        shouldDirty: true,
      });

      autoSave(markdown, html ?? "");
    },
    [setTextContent, setValue, autoSave]
  );

  return (
    <div className="p-10">
      <TextEditor
        onChange={handleTextEditorChange}
        initialContent={stableInitialContent}
        key={`text-editor-${id || "new"}`}
        debounceDelay={300}
      />
    </div>
  );
};
