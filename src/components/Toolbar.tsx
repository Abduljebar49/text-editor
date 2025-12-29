// src/components/Toolbar.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Heading1,
  Heading2,
  FileDown,
  Save,
  Trash2,
  Type,
  Image as ImageIcon,
  Undo,
  Redo,
  Code,
  Superscript,
  Subscript,
  Quote,
  Indent,
  Outdent,
} from "lucide-react";

interface ToolbarProps {
  onCommand: (command: string, value?: string) => void;
  onSave: () => void;
  onExport: () => void;
  onClear: () => void;
  onImageUpload: () => void;
  showButtons?: boolean;
  hasUnsavedChanges: boolean;
  pendingImagesCount?: number;
}

interface ToolbarButtonBase {
  id: string;
}

interface ToolbarActionButton extends ToolbarButtonBase {
  separator?: false;
  command?: string;
  value?: string;
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

interface ToolbarSeparator extends ToolbarButtonBase {
  separator: true;
}

export type ToolbarButton = ToolbarActionButton | ToolbarSeparator;

export const Toolbar: React.FC<ToolbarProps> = ({
  onCommand,
  onSave,
  onExport,
  onClear,
  onImageUpload,
  showButtons = false,
  hasUnsavedChanges,
  pendingImagesCount = 0,
}) => {
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [currentBlockFormat, setCurrentBlockFormat] = useState<string>("p");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikeThrough, setIsStrikeThrough] = useState(false);
  const [isUnorderedList, setIsUnorderedList] = useState(false);
  const [isOrderedList, setIsOrderedList] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right" | "justify">("left");
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Update active formats based on current selection
  const updateActiveFormats = useCallback(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // Check inline formats
    setIsBold(document.queryCommandState("bold"));
    setIsItalic(document.queryCommandState("italic"));
    setIsUnderline(document.queryCommandState("underline"));
    setIsStrikeThrough(document.queryCommandState("strikeThrough"));
    setIsUnorderedList(document.queryCommandState("insertUnorderedList"));
    setIsOrderedList(document.queryCommandState("insertOrderedList"));
    
    // Check text alignment
    if (document.queryCommandState("justifyLeft")) setTextAlign("left");
    else if (document.queryCommandState("justifyCenter")) setTextAlign("center");
    else if (document.queryCommandState("justifyRight")) setTextAlign("right");
    
    // Check for block formats
    let node: Node | null = container;
    let blockFormat = "p";
    
    // Traverse up to find block element
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        
        if (["h1", "h2", "h3", "h4", "h5", "h6", "p", "div", "blockquote", "pre"].includes(tagName)) {
          if (["h1", "h2"].includes(tagName)) {
            blockFormat = tagName;
          }
          break;
        }
      }
      node = node.parentNode;
    }
    
    setCurrentBlockFormat(blockFormat);
    
    // Build active formats array for button highlighting
    const formats: string[] = [];
    if (isBold) formats.push("bold");
    if (isItalic) formats.push("italic");
    if (isUnderline) formats.push("underline");
    if (isStrikeThrough) formats.push("strikeThrough");
    if (isUnorderedList) formats.push("insertUnorderedList");
    if (isOrderedList) formats.push("insertOrderedList");
    if (textAlign === "left") formats.push("justifyLeft");
    if (textAlign === "center") formats.push("justifyCenter");
    if (textAlign === "right") formats.push("justifyRight");
    if (blockFormat === "h1" || blockFormat === "h2") {
      formats.push(`formatBlock:${blockFormat}`);
    }
    
    setActiveFormats(formats);
  }, [isBold, isItalic, isUnderline, isStrikeThrough, isUnorderedList, isOrderedList, textAlign]);

  // Handle selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      requestAnimationFrame(updateActiveFormats);
    };

    const handleMouseUp = () => {
      setTimeout(updateActiveFormats, 10);
    };

    const handleKeyUp = () => {
      setTimeout(updateActiveFormats, 10);
    };

    // Listen for selection changes
    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keyup", handleKeyUp);

    // Initial update
    updateActiveFormats();

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [updateActiveFormats]);

  const handleLinkInsert = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) {
      onCommand("createLink", url);
    }
  };

  const handleImageInsert = () => {
    onImageUpload();
  };

  const handleFormatBlock = (value: string) => {
    onCommand("formatBlock", value);
  };

  const handleIndent = () => {
    onCommand("indent");
  };

  const handleOutdent = () => {
    onCommand("outdent");
  };

  const handleUndo = () => {
    onCommand("undo");
  };

  const handleRedo = () => {
    onCommand("redo");
  };

  const handleInsertCode = () => {
    onCommand("formatBlock", "pre");
  };

  const handleInsertQuote = () => {
    onCommand("formatBlock", "blockquote");
  };

  const handleSuperscript = () => {
    onCommand("superscript");
  };

  const handleSubscript = () => {
    onCommand("subscript");
  };

  // Toolbar button configurations
  const buttonConfigs: ToolbarButton[] = [
    {
      id: "undo",
      command: "undo",
      icon: <Undo size={18} />,
      title: "Undo",
      onClick: handleUndo,
    },
    {
      id: "redo",
      command: "redo",
      icon: <Redo size={18} />,
      title: "Redo",
      onClick: handleRedo,
    },
    { id: "separator-1", separator: true },
    {
      id: "bold",
      command: "bold",
      icon: <Bold size={18} />,
      title: "Bold (Ctrl+B)",
      isActive: isBold,
    },
    {
      id: "italic",
      command: "italic",
      icon: <Italic size={18} />,
      title: "Italic (Ctrl+I)",
      isActive: isItalic,
    },
    {
      id: "underline",
      command: "underline",
      icon: <Underline size={18} />,
      title: "Underline (Ctrl+U)",
      isActive: isUnderline,
    },
    {
      id: "strikeThrough",
      command: "strikeThrough",
      icon: <Strikethrough size={18} />,
      title: "Strikethrough",
      isActive: isStrikeThrough,
    },
    { id: "separator-2", separator: true },
    {
      id: "heading-1",
      command: "formatBlock",
      value: "h1",
      icon: <Heading1 size={18} />,
      title: "Heading 1",
      isActive: currentBlockFormat === "h1",
    },
    {
      id: "heading-2",
      command: "formatBlock",
      value: "h2",
      icon: <Heading2 size={18} />,
      title: "Heading 2",
      isActive: currentBlockFormat === "h2",
    },
    {
      id: "paragraph",
      command: "formatBlock",
      value: "p",
      icon: <Type size={18} />,
      title: "Paragraph",
      isActive: currentBlockFormat === "p",
    },
    {
      id: "code",
      command: "formatBlock",
      value: "pre",
      icon: <Code size={18} />,
      title: "Code Block",
      onClick: handleInsertCode,
    },
    {
      id: "quote",
      command: "formatBlock",
      value: "blockquote",
      icon: <Quote size={18} />,
      title: "Blockquote",
      onClick: handleInsertQuote,
    },
    { id: "separator-3", separator: true },
    {
      id: "unordered-list",
      command: "insertUnorderedList",
      icon: <List size={18} />,
      title: "Bullet List",
      isActive: isUnorderedList,
    },
    {
      id: "ordered-list",
      command: "insertOrderedList",
      icon: <ListOrdered size={18} />,
      title: "Numbered List",
      isActive: isOrderedList,
    },
    {
      id: "indent",
      command: "indent",
      icon: <Indent size={18} />,
      title: "Indent",
      onClick: handleIndent,
    },
    {
      id: "outdent",
      command: "outdent",
      icon: <Outdent size={18} />,
      title: "Outdent",
      onClick: handleOutdent,
    },
    { id: "separator-4", separator: true },
    {
      id: "align-left",
      command: "justifyLeft",
      icon: <AlignLeft size={18} />,
      title: "Align Left",
      isActive: textAlign === "left",
    },
    {
      id: "align-center",
      command: "justifyCenter",
      icon: <AlignCenter size={18} />,
      title: "Center",
      isActive: textAlign === "center",
    },
    {
      id: "align-right",
      command: "justifyRight",
      icon: <AlignRight size={18} />,
      title: "Align Right",
      isActive: textAlign === "right",
    },
    { id: "separator-5", separator: true },
    {
      id: "superscript",
      command: "superscript",
      icon: <Superscript size={18} />,
      title: "Superscript",
      onClick: handleSuperscript,
    },
    {
      id: "subscript",
      command: "subscript",
      icon: <Subscript size={18} />,
      title: "Subscript",
      onClick: handleSubscript,
    },
    {
      id: "link",
      command: "createLink",
      icon: <LinkIcon size={18} />,
      title: "Insert Link",
      onClick: handleLinkInsert,
    },
    {
      id: "image",
      command: "insertImage",
      icon: pendingImagesCount > 0 ? (
        <div className="relative">
          <ImageIcon size={18} />
          <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {pendingImagesCount}
          </span>
        </div>
      ) : (
        <ImageIcon size={18} />
      ),
      title: "Insert Image",
      onClick: handleImageInsert,
    },
  ];

  // Group buttons for responsive design
  const renderButtonGroup = (buttons: ToolbarButton[]) => {
    return (
      <div className="flex items-center border-r border-gray-200 pr-2 mr-2 last:border-r-0 last:pr-0 last:mr-0">
        {buttons.map((button) => {
          if (button.separator) {
            return (
              <div key={button.id} className="w-px h-6 bg-gray-300 mx-2" />
            );
          }

          const isActive = button.isActive !== undefined 
            ? button.isActive 
            : button.command 
              ? activeFormats.includes(button.command) || 
                (button.command === 'formatBlock' && button.value === currentBlockFormat)
              : false;

          return (
            <button
              key={button.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (button.onClick) {
                  button.onClick();
                } else if (button.command === 'formatBlock' && button.value) {
                  handleFormatBlock(button.value);
                } else if (button.command) {
                  onCommand(button.command, button.value);
                }
                
                // Refocus on editor after button click
                setTimeout(() => {
                  const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
                  if (editor) {
                    editor.focus();
                  }
                }, 10);
              }}
              title={button.title}
              type="button"
              className={`min-w-[36px] h-9 flex items-center justify-center rounded-md border transition-all duration-150 ${
                isActive
                  ? "bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200 shadow-sm"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
              } active:scale-95 mx-0.5`}
              disabled={button.disabled}
            >
              {button.icon}
            </button>
          );
        })}
      </div>
    );
  };

  // Group buttons logically
  const historyButtons = buttonConfigs.slice(0, 3); // Undo, Redo, Separator
  const formatButtons = buttonConfigs.slice(3, 10); // Bold, Italic, Underline, StrikeThrough, Separator
  const blockButtons = buttonConfigs.slice(10, 16); // Headings, Paragraph, Code, Quote
  const listButtons = buttonConfigs.slice(16, 20); // Lists, Indent, Outdent
  const alignButtons = buttonConfigs.slice(20, 24); // Alignment
  const extraButtons = buttonConfigs.slice(24, 28); // Superscript, Subscript
  const insertButtons = buttonConfigs.slice(28); // Link, Image

  return (
    <div 
      ref={editorContainerRef}
      className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between p-3 bg-gray-50 border-b border-gray-200 gap-2"
    >
      {/* Formatting toolbar */}
      <div className="flex flex-wrap items-center gap-1 order-1 w-full sm:w-auto">
        {renderButtonGroup(historyButtons)}
        {renderButtonGroup(formatButtons)}
        {renderButtonGroup(blockButtons)}
        {renderButtonGroup(listButtons)}
        {renderButtonGroup(alignButtons)}
        {renderButtonGroup(extraButtons)}
        {renderButtonGroup(insertButtons)}
      </div>

      {/* Conditional Actions section */}
      {showButtons && (
        <div className="flex items-center gap-2 order-2 sm:order-3 mt-2 sm:mt-0 flex-shrink-0">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave();
              setTimeout(() => {
                const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
                if (editor) editor.focus();
              }, 10);
            }}
            disabled={!hasUnsavedChanges}
            title="Save Document (Ctrl+S)"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200 active:scale-95"
          >
            <Save size={16} />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onExport();
              setTimeout(() => {
                const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
                if (editor) editor.focus();
              }, 10);
            }}
            title="Export as HTML"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors duration-200 active:scale-95"
          >
            <FileDown size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
              setTimeout(() => {
                const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
                if (editor) editor.focus();
              }, 10);
            }}
            title="Clear Editor"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors duration-200 active:scale-95"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      )}

      {/* Status indicators */}
      <div className="flex items-center gap-3 text-sm text-gray-500 order-3 sm:order-2 mt-2 sm:mt-0 flex-shrink-0">
        {pendingImagesCount > 0 && (
          <span className="flex items-center gap-1">
            <ImageIcon size={14} />
            <span>{pendingImagesCount} pending</span>
          </span>
        )}
        {hasUnsavedChanges && (
          <span className="flex items-center gap-1 text-amber-600">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            <span>Unsaved changes</span>
          </span>
        )}
      </div>
    </div>
  );
};