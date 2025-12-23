// src/components/Toolbar.tsx
import React, { useState, useEffect } from "react";
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
  Image as ImageIcon
} from "lucide-react";

interface ToolbarProps {
  onCommand: (command: string, value?: string) => void;
  onSave: () => void;
  onExport: () => void;
  onClear: () => void;
  onImageUpload: () => void; // New prop for image upload
  showButtons?: boolean;
  hasUnsavedChanges: boolean;
  pendingImagesCount?: number; // New prop to show count
}

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

  // Track current formatting to highlight active buttons
  const updateActiveFormats = () => {
    const formats: string[] = [];
    let blockFormat = "p"; // Default to paragraph
    
    if (document.queryCommandState("bold")) formats.push("bold");
    if (document.queryCommandState("italic")) formats.push("italic");
    if (document.queryCommandState("underline")) formats.push("underline");
    if (document.queryCommandState("strikeThrough")) formats.push("strikeThrough");
    if (document.queryCommandState("insertUnorderedList")) formats.push("insertUnorderedList");
    if (document.queryCommandState("insertOrderedList")) formats.push("insertOrderedList");
    if (document.queryCommandState("justifyLeft")) formats.push("justifyLeft");
    if (document.queryCommandState("justifyCenter")) formats.push("justifyCenter");
    if (document.queryCommandState("justifyRight")) formats.push("justifyRight");
    
    // Check for block formats more accurately
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let parentElement = selection.getRangeAt(0).commonAncestorContainer as Node;
      
      // Traverse up the DOM tree to find the block-level element
      while (parentElement && parentElement.nodeType === Node.ELEMENT_NODE) {
        const element = parentElement as Element;
        const tagName = element.tagName.toLowerCase();
        
        if (["h1", "h2", "p", "div"].includes(tagName)) {
          if (tagName === "h1" || tagName === "h2") {
            blockFormat = tagName;
            formats.push(`formatBlock:${tagName}`);
          } else if (tagName === "p" || (tagName === "div" && !blockFormat)) {
            // Only set to paragraph if we haven't found a heading
            blockFormat = "p";
          }
          break;
        }
        
        parentElement = element.parentNode as Node;
      }
    }

    setCurrentBlockFormat(blockFormat);
    setActiveFormats(formats);
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    // Also update on click and keyup to catch typing changes
    const handleInputEvents = () => {
      setTimeout(updateActiveFormats, 10); // Small delay to ensure DOM is updated
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("click", handleInputEvents);
    document.addEventListener("keyup", handleInputEvents);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("click", handleInputEvents);
      document.removeEventListener("keyup", handleInputEvents);
    };
  }, []);

  const handleLinkInsert = () => {
    const url = prompt("Enter URL:");
    if (url) {
      onCommand("createLink", url);
    }
  };

  const buttonConfigs = [
    {
      id: "bold",
      command: "bold",
      icon: <Bold size={18} />,
      title: "Bold",
    },
    {
      id: "italic",
      command: "italic",
      icon: <Italic size={18} />,
      title: "Italic",
    },
    {
      id: "underline",
      command: "underline",
      icon: <Underline size={18} />,
      title: "Underline",
    },
    {
      id: "strikeThrough",
      command: "strikeThrough",
      icon: <Strikethrough size={18} />,
      title: "Strikethrough",
    },
    { id: "separator-1", separator: true },
    {
      id: "unordered-list",
      command: "insertUnorderedList",
      icon: <List size={18} />,
      title: "Bullet List",
    },
    {
      id: "ordered-list",
      command: "insertOrderedList",
      icon: <ListOrdered size={18} />,
      title: "Numbered List",
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
    { id: "separator-3", separator: true },
    {
      id: "align-left",
      command: "justifyLeft",
      icon: <AlignLeft size={18} />,
      title: "Align Left",
    },
    {
      id: "align-center",
      command: "justifyCenter",
      icon: <AlignCenter size={18} />,
      title: "Center",
    },
    {
      id: "align-right",
      command: "justifyRight",
      icon: <AlignRight size={18} />,
      title: "Align Right",
    },
    { id: "separator-4", separator: true },
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
      onClick: onImageUpload,
    },
  ];

  return (
    <div className="flex flex-wrap justify-between items-center p-3 bg-gray-50 border-b border-gray-200">
      {/* Formatting section */}
      <div className="flex flex-wrap items-center gap-1">
        {buttonConfigs.map((button) => {
          if ("separator" in button) {
            return (
              <div key={button.id} className="w-px h-6 bg-gray-300 mx-2" />
            );
          }

          // For block format buttons, use the specific isActive property
          // For other buttons, use the activeFormats array
          const isActive = button.isActive !== undefined 
            ? button.isActive 
            : activeFormats.includes(button.command);

          return (
            <button
              key={button.id}
              onClick={() => 
                button.onClick 
                  ? button.onClick() 
                  : onCommand(button.command, button.value)
              }
              title={button.title}
              type="button"
              className={`w-9 h-9 flex items-center justify-center rounded-md border transition-colors duration-200 ${
                isActive
                  ? "bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {button.icon}
            </button>
          );
        })}
      </div>

      {/* Conditional Actions section */}
      {showButtons && (
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <button
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            title="Save Document"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Save size={16} />
            <span>Save</span>
          </button>

          <button
            onClick={onExport}
            title="Export as HTML"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            <FileDown size={16} />
            <span>Export</span>
          </button>

          <button
            onClick={onClear}
            title="Clear Editor"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            <Trash2 size={16} />
            <span>Clear</span>
          </button>
        </div>
      )}
    </div>
  );
};