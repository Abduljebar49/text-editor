// src/components/Toolbar.tsx
import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';

interface ToolbarProps {
  onCommand: (command: string, value?: string) => void;
  onSave: () => void;
  onExport: () => void;
  onClear: () => void;
  hasUnsavedChanges: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onCommand,
  onSave,
  onExport,
  onClear,
  hasUnsavedChanges,
}) => {
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  // Track current formatting to highlight active buttons
  const updateActiveFormats = () => {
    const commands = [
      'bold',
      'italic',
      'underline',
      'strikeThrough',
      'justifyLeft',
      'justifyCenter',
      'justifyRight',
    ];
    const active: string[] = [];
    commands.forEach((cmd) => {
      if (document.queryCommandState(cmd)) active.push(cmd);
    });
    setActiveFormats(active);
  };

  useEffect(() => {
    document.addEventListener('selectionchange', updateActiveFormats);
    return () => document.removeEventListener('selectionchange', updateActiveFormats);
  }, []);

  const handleLinkInsert = () => {
    const url = prompt('Enter URL:');
    if (url) onCommand('createLink', url);
  };

  const buttons = [
    { command: 'bold', icon: <Bold size={18} />, title: 'Bold' },
    { command: 'italic', icon: <Italic size={18} />, title: 'Italic' },
    { command: 'underline', icon: <Underline size={18} />, title: 'Underline' },
    { command: 'strikeThrough', icon: <Strikethrough size={18} />, title: 'Strikethrough' },
    { separator: true },
    { command: 'insertUnorderedList', icon: <List size={18} />, title: 'Bullet List' },
    { command: 'insertOrderedList', icon: <ListOrdered size={18} />, title: 'Numbered List' },
    { separator: true },
    { command: 'formatBlock', value: 'h1', icon: <Heading1 size={18} />, title: 'Heading 1' },
    { command: 'formatBlock', value: 'h2', icon: <Heading2 size={18} />, title: 'Heading 2' },
    { command: 'formatBlock', value: 'p', icon: <Type size={18} />, title: 'Paragraph' },
    { separator: true },
    { command: 'justifyLeft', icon: <AlignLeft size={18} />, title: 'Align Left' },
    { command: 'justifyCenter', icon: <AlignCenter size={18} />, title: 'Center' },
    { command: 'justifyRight', icon: <AlignRight size={18} />, title: 'Align Right' },
    { separator: true },
    { command: 'createLink', icon: <LinkIcon size={18} />, title: 'Insert Link' },
  ];

  return (
    <div className="flex flex-wrap justify-between items-center p-3 bg-gray-50 border-b border-gray-200">
      {/* Formatting section */}
      <div className="flex flex-wrap items-center gap-1">
        {buttons.map((button, index) => {
          if ('separator' in button) {
            return <div key={index} className="w-px h-6 bg-gray-300 mx-2 inline" />;
          }

          const isActive = activeFormats.includes(button.command);

          return (
            <button
              key={index}
              onClick={() =>
                button.command === 'createLink'
                  ? handleLinkInsert()
                  : onCommand(button.command, button.value)
              }
              title={button.title}
              type="button"
              className={`w-9 h-9 flex items-center justify-center rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition 
                ${isActive ? 'bg-blue-100 text-blue-600 border-blue-300' : 'bg-white'}`}
            >
              {button.icon}
            </button>
          );
        })}
      </div>

      {/* Actions section */}
      <div className="flex items-center gap-2 mt-2 sm:mt-0">
        <button
          onClick={onSave}
          disabled={!hasUnsavedChanges}
          title="Save Document"
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
        >
          <Save size={16} /> Save
        </button>

        <button
          onClick={onExport}
          title="Export as HTML"
          className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition"
        >
          <FileDown size={16} /> Export
        </button>

        <button
          onClick={onClear}
          title="Clear Editor"
          className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition"
        >
          <Trash2 size={16} /> Clear
        </button>
      </div>
    </div>
  );
};
