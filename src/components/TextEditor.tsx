// src/components/TextEditor.tsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "../utils";

interface TextEditorProps {
  initialContent?: string;
  onChange?: (content: string, html: string, title?: string) => void;
  onSave?: (content: string, html: string) => void;
  onExport?: (html: string) => void;
  readOnly?: boolean;
  showButtons?: boolean;
  showSaveTitle?: boolean;
  showStatusBar?: boolean;
  height?: string;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  initialContent = "",
  onChange,
  onSave,
  onExport,
  readOnly = false,
  showButtons = false,
  showSaveTitle = false,
  showStatusBar = false,
  height = "500px",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [title, setTitle] = useState("Untitled Document");
  const [content, setContent] = useState(initialContent);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
  });

  // Initialize content with proper styling
  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
      setContent(initialContent);
      applyEditorStyles();
    }
  }, [initialContent]);

  // Apply editor styles to the content
  const applyEditorStyles = useCallback(() => {
    if (!editorRef.current) return;

    // Apply styles to existing elements
    const applyStylesToElement = (element: Element) => {
      const tagName = element.tagName.toLowerCase();
      
      switch (tagName) {
        case 'h1':
          element.classList.add('text-3xl', 'font-bold', 'mt-6', 'mb-4', 'text-gray-800', 'border-b', 'pb-2');
          break;
        case 'h2':
          element.classList.add('text-2xl', 'font-bold', 'mt-5', 'mb-3', 'text-gray-800');
          break;
        case 'h3':
          element.classList.add('text-xl', 'font-bold', 'mt-4', 'mb-2', 'text-gray-800');
          break;
        case 'p':
          element.classList.add('mb-4', 'text-gray-700', 'leading-relaxed');
          break;
        case 'ul':
          element.classList.add('list-disc', 'list-inside', 'mb-4', 'ml-4', 'space-y-1');
          break;
        case 'ol':
          element.classList.add('list-decimal', 'list-inside', 'mb-4', 'ml-4', 'space-y-1');
          break;
        case 'li':
          element.classList.add('mb-1');
          break;
        case 'a':
          element.classList.add('text-blue-600', 'hover:text-blue-800', 'underline', 'transition-colors');
          break;
        case 'blockquote':
          element.classList.add('border-l-4', 'border-blue-500', 'pl-4', 'italic', 'text-gray-600', 'my-4');
          break;
        case 'code':
          if (element.parentElement?.tagName.toLowerCase() !== 'pre') {
            element.classList.add('bg-gray-100', 'px-2', 'py-1', 'rounded', 'text-sm', 'font-mono');
          }
          break;
        case 'pre':
          element.classList.add('bg-gray-800', 'text-gray-100', 'p-4', 'rounded-lg', 'overflow-x-auto', 'my-4');
          break;
      }

      // Apply to all children
      Array.from(element.children).forEach(applyStylesToElement);
    };

    // Apply styles to all top-level elements
    Array.from(editorRef.current.children).forEach(applyStylesToElement);
  }, []);

  // ---- Update active formats ----
  const updateActiveFormats = useCallback(() => {
    if (readOnly || !editorRef.current) return;
    
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.toString().length > 0) {
        setActiveFormats({
          bold: document.queryCommandState("bold"),
          italic: document.queryCommandState("italic"),
          underline: document.queryCommandState("underline"),
          strikeThrough: document.queryCommandState("strikeThrough"),
        });
      } else {
        setActiveFormats({
          bold: false,
          italic: false,
          underline: false,
          strikeThrough: false,
        });
      }
    } catch (error) {
      console.warn("Format state detection not available:", error);
    }
  }, [readOnly]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    
    const html = editorRef.current.innerHTML || "";
    const text = editorRef.current.innerText || "";
    setContent(html);
    onChange?.(text, html, title);

    // Apply styles to any new elements
    applyEditorStyles();
    updateActiveFormats();
  }, [onChange, title, applyEditorStyles, updateActiveFormats]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    const html = editorRef.current?.innerHTML || "";
    const text = editorRef.current?.innerText || "";
    onChange?.(text, html, newTitle);
  };


  // Enhanced format block command with styling
  const formatBlockWithStyle = useCallback((tagName: string) => {
    if (readOnly || !editorRef.current) return;

    try {
      editorRef.current.focus();
      
      // Use the browser's formatBlock command
      document.execCommand('formatBlock', false, `<${tagName}>`);
      
      // Apply our styles after a brief delay to ensure the element is created
      setTimeout(applyEditorStyles, 10);
      
      handleInput();
      updateActiveFormats();
    } catch (error) {
      console.warn(`Format block ${tagName} failed:`, error);
    }
  }, [readOnly, applyEditorStyles, handleInput, updateActiveFormats]);

  // Enhanced list commands with styling
  const insertListWithStyle = useCallback((command: string) => {
    if (readOnly || !editorRef.current) return;

    try {
      editorRef.current.focus();
      document.execCommand(command, false, undefined);
      
      // Apply styles after list is created
      setTimeout(applyEditorStyles, 10);
      
      handleInput();
      updateActiveFormats();
    } catch (error) {
      console.warn(`List command ${command} failed:`, error);
    }
  }, [readOnly, applyEditorStyles, handleInput, updateActiveFormats]);

  // ---- Handle Focus / Blur ----
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
        setShowTextColorPicker(false);
        setShowBgColorPicker(false);
      }
    };

    if (!readOnly) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [readOnly]);

  const handleFocus = () => {
    if (!readOnly) setIsFocused(true);
  };

  const handleBlur = () => {
    if (!readOnly) {
      setTimeout(() => setIsFocused(false), 200);
    }
  };

  

  // ---- Handle Content Updates ----
  

  // ---- Command Execution ----
  const exec = useCallback(
    (command: string, value?: string) => {
      if (readOnly) return;
      
      try {
        editorRef.current?.focus();
        
        // Handle special commands with styling
        if (command === "formatBlock") {
          formatBlockWithStyle(value || "p");
          return;
        } else if (command === "insertUnorderedList" || command === "insertOrderedList") {
          insertListWithStyle(command);
          return;
        } else {
          document.execCommand(command, false, value);
        }
        
        handleInput();
        updateActiveFormats();
      } catch (error) {
        console.warn(`Command ${command} failed:`, error);
      }
    },
    [readOnly, formatBlockWithStyle, insertListWithStyle, handleInput, updateActiveFormats]
  );

  // ---- Handle toolbar button clicks ----
  const handleToolbarClick = useCallback((handler: () => void) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      handler();
    };
  }, []);

  // ---- Color Palettes ----
  const textColors = [
    "#000000", "#FF0000", "#FF9900", "#FFFF00", "#00FF00",
    "#00FFFF", "#4A86E8", "#9900FF", "#FF00FF", "#FFFFFF",
  ];

  const bgColors = [
    "#FFFFFF", "#FFE6E6", "#FFF2CC", "#FFFFCC", "#E6FFE6",
    "#E6FFFF", "#E6F0FF", "#F0E6FF", "#FFE6FF", "#000000",
  ];

  // ---- Action Handlers ----
  const handleSave = useCallback(() => {
    const html = editorRef.current?.innerHTML || "";
    const text = editorRef.current?.innerText || "";
    onSave?.(text, html);
  }, [onSave]);

  const handleExport = useCallback(() => {
    const html = editorRef.current?.innerHTML || "";
    onExport?.(html);
  }, [onExport]);

  // ---- Toolbar Components ----
  const ToolbarDivider = () => <div className="w-px h-6 bg-gray-300 mx-1" />;

  const ToolbarButton: React.FC<{
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    isActive?: boolean;
    className?: string;
  }> = ({ onClick, title, children, isActive = false, className = "" }) => (
    <button
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors",
        isActive && "bg-blue-100 text-blue-600 border border-blue-300",
        className
      )}
      onMouseDown={(e) => e.preventDefault()}
      onClick={handleToolbarClick(onClick)}
      title={title}
      type="button"
      disabled={readOnly}
    >
      {children}
    </button>
  );

  const ColorPicker: React.FC<{
    colors: string[];
    onColorSelect: (color: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    buttonContent: React.ReactNode;
    title: string;
  }> = ({ colors, onColorSelect, isOpen, onToggle, buttonContent, title }) => (
    <div className="relative">
      <ToolbarButton 
        onClick={onToggle} 
        title={title} 
        className="relative"
      >
        {buttonContent}
        <span className="absolute -bottom-1 -right-1 text-[8px]">▼</span>
      </ToolbarButton>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 grid grid-cols-5 gap-1 z-20 min-w-[120px]">
          {colors.map((color) => (
            <button
              key={color}
              className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleToolbarClick(() => {
                onColorSelect(color);
                onToggle();
              })}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Editor content styles as inline classes
  const editorContentClasses = `
    [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:text-gray-800 [&_h1]:border-b [&_h1]:pb-2
    [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:text-gray-800
    [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-gray-800
    [&_p]:mb-4 [&_p]:text-gray-700 [&_p]:leading-relaxed
    [&_ul]:list-disc [&_ul]:list-inside [&_ul]:mb-4 [&_ul]:ml-4 [&_ul]:space-y-1
    [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-4 [&_ol]:ml-4 [&_ol]:space-y-1
    [&_li]:mb-1
    [&_a]:text-blue-600 [&_a]:hover:text-blue-800 [&_a]:underline [&_a]:transition-colors
    [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-4
    [&_code]:bg-gray-100 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
    [&_pre]:bg-gray-800 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4
    [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0
  `;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full bg-white border border-gray-300 rounded-lg overflow-hidden",
        readOnly && "pointer-events-none opacity-80"
      )}
    >
      {/* Title Input */}
      {showSaveTitle && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <input
            type="text"
            className={cn(
              "w-full bg-transparent text-2xl font-bold text-gray-800 outline-none placeholder-gray-400",
              readOnly && "cursor-default"
            )}
            value={title}
            onChange={handleTitleChange}
            placeholder="Document Title"
            readOnly={readOnly}
          />
        </div>
      )}

      {/* Action Buttons */}
      {showButtons && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={readOnly}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export
          </button>
        </div>
      )}

      {/* Fixed Horizontal Toolbar */}
      {!readOnly && isFocused && (
        <div
          ref={toolbarRef}
          className="border-b border-gray-200 bg-white px-4 py-2 flex items-center gap-1 flex-wrap sticky top-0 z-10"
        >
          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => exec("bold")}
            title="Bold"
            isActive={activeFormats.bold}
          >
            <span className="font-bold text-sm">B</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => exec("italic")}
            title="Italic"
            isActive={activeFormats.italic}
          >
            <span className="italic text-sm">I</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => exec("underline")}
            title="Underline"
            isActive={activeFormats.underline}
          >
            <span className="underline text-sm">U</span>
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => exec("insertUnorderedList")}
            title="Bulleted List"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4,3c0,1.1-0.9,2-2,2S0,4.1,0,3s0.9-2,2-2S4,1.9,4,3z M2,9c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S3.1,9,2,9z M2,17c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S3.1,17,2,17z M24,19c0-0.6-0.4-1-1-1H8c-0.6,0-1,0.4-1,1s0.4,1,1,1h15C23.6,20,24,19.6,24,19z M24,11c0-0.6-0.4-1-1-1H8c-0.6,0-1,0.4-1,1s0.4,1,1,1h15C23.6,12,24,11.6,24,11z M24,3c0-0.6-0.4-1-1-1H8C7.4,2,7,2.4,7,3s0.4,1,1,1h15C23.6,4,24,3.6,24,3z" />
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => exec("insertOrderedList")}
            title="Numbered List"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 3a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H11a1 1 0 0 1-1-1Zm13 9H11a1 1 0 1 0 0 2h12a1 1 0 1 0 0-2Zm0 10H11a1 1 0 1 0 0 2h12a1 1 0 1 0 0-2ZM4 2.41V9.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V1A1 1 0 0 0 4.669.056L.925 1.37a.499.499 0 0 0-.306.637l.331.944a.5.5 0 0 0 .637.307l2.414-.846H4ZM1 24h6.5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5H2.287c.556-.938 1.787-1.578 2.532-1.965l.339-.177C6.425 19.195 8 18.372 8 15.813 8 13.971 6.393 12 4 12 1.363 12 .409 14.103.272 15.214c0 0-.039.284-.062.504-.023.22.151.483.416.54.265.055.797.094 1.015.13.218.034.5-.06.537-.387.025-.22.078-.533.078-.533C2.291 15.223 2.543 14 4 14c1.239 0 2 1.056 2 1.813 0 1.293-.542 1.631-1.769 2.272l-.333.174C2.632 18.916 0 20.282 0 23 0 23 0 24 1 24Z" />
            </svg>
          </ToolbarButton>

          <ToolbarDivider />

          {/* Headers */}
          <ToolbarButton
            onClick={() => exec("formatBlock", "h1")}
            title="Heading 1"
          >
            <span className="text-xs font-bold">H1</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => exec("formatBlock", "h2")}
            title="Heading 2"
          >
            <span className="text-xs font-bold">H2</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => exec("formatBlock", "h3")}
            title="Heading 3"
          >
            <span className="text-xs font-bold">H3</span>
          </ToolbarButton>

          <ToolbarDivider />

          {/* Quote & Code */}
          <ToolbarButton
            onClick={() => exec("formatBlock", "blockquote")}
            title="Quote"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 3v20a1 1 0 1 1-2 0V3a1 1 0 1 1 2 0Zm5 3h12a1 1 0 1 0 0 2H7a1 1 0 1 0 0 2Zm16 6H7a1 1 0 1 0 0 2h16a1 1 0 1 0 0-2Zm-4 8H7a1 1 0 1 0 0 2h12a1 1 0 1 0 0-2Z" />
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => exec("formatBlock", "pre")}
            title="Code Block"
          >
            <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
              <path d="M32 10v6a1 1 0 1 1-2 0v-6c0-2.206-1.794-4-4-4H6c-2.206 0-4 1.794-4 4v12c0 2.206 1.794 4 4 4h3a1 1 0 1 1 0 2H6c-3.309 0-6-2.691-6-6V10c0-3.309 2.691-6 6-6h20c3.309 0 6 2.691 6 6Zm-13.359 8.232a1 1 0 0 0-1.409.128l-5 6a1 1 0 0 0 0 1.28l5 6a1 1 0 0 0 1.538-1.28L14.303 25l4.467-5.36a1 1 0 0 0-.129-1.408Zm8.128.128a1 1 0 0 0-1.537 1.28L29.699 25l-4.467 5.36a1 1 0 1 0 1.538 1.28l5-6a1 1 0 0 0 0-1.28l-5.001-6Z" />
            </svg>
          </ToolbarButton>

          <ToolbarDivider />

          {/* Actions */}
          <ToolbarButton onClick={() => exec("undo")} title="Undo">
            <span className="text-sm">↶</span>
          </ToolbarButton>

          <ToolbarButton onClick={() => exec("redo")} title="Redo">
            <span className="text-sm">↷</span>
          </ToolbarButton>
        </div>
      )}

      {/* Editable Content with Built-in Styling */}
      <div
        ref={editorRef}
        className={cn(
          "p-6 outline-none",
          editorContentClasses,
          readOnly ? "bg-transparent cursor-default" : "cursor-text bg-white",
          "min-h-[500px]"
        )}
        contentEditable={!readOnly}
        suppressContentEditableWarning={true}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            exec('indent');
          }
        }}
        data-placeholder={readOnly ? "" : "Start typing..."}
        style={{ minHeight: height }}
      />

      {/* Status Bar */}
      {showStatusBar && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between">
          <span>
            Words:{" "}
            {editorRef.current?.innerText?.split(/\s+/).filter((word) => word.length > 0).length || 0}
          </span>
          <span>Characters: {editorRef.current?.innerText?.length || 0}</span>
        </div>
      )}
    </div>
  );
};