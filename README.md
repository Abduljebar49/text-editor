# @abduljebar/text-editor

A modern, feature-rich React text editor component with beautiful styling and extensive customization options. Perfect for blogs, content management systems, and any application requiring rich text editing capabilities.

## ✨ Features

### 🎨 Rich Text Editing
- **Text Formatting**: Bold, italic, underline, strikethrough
- **Headings**: H1, H2 with automatic styling
- **Lists**: Bulleted and numbered lists
- **Alignment**: Left, center, right alignment
- **Block Elements**: Quotes and code blocks
- **Undo/Redo**: Full history support
- **Additional Formatting**: Superscript, subscript, indentation

### 📁 File Management
- **Image Upload**: Drag & drop, paste, or file picker
- **Image Validation**: File type and size validation
- **Pending Images**: Track and upload pending images
- **HTML Export**: Generate complete HTML documents with styling
- **Auto-save**: Debounced content changes with configurable delay

### 🎯 Smart UX
- **Contextual Toolbar**: Appears only when focused and editable
- **Real-time Stats**: Word and character count in status bar
- **Smart Format Detection**: Visual indicators for active text formats
- **Keyboard Shortcuts**: Ctrl+S (save), Ctrl+E (export)
- **Auto-focus**: Automatic focus on load
- **Placeholder Support**: Visual placeholder when empty

### 🔧 Flexible Configuration
- **Read-only Mode**: Display content without editing capabilities
- **Customizable Height**: Flexible sizing options
- **Title Support**: Optional document title with real-time updates
- **Action Buttons**: Built-in save and export functionality
- **Event Handling**: Comprehensive callback system
- **Debounce Control**: Configurable change debouncing

### 🚀 Advanced Features
- **React Hook**: `useTextEditor` for custom implementations
- **Ref API**: Exposed methods for programmatic control
- **Selection Management**: Proper cursor and selection handling
- **Paste/Upload Handling**: Smart image and content paste handling
- **TypeScript**: Fully typed for better development experience
- **Validation**: Built-in content validation

## 📦 Installation

```bash
npm install @abduljebar/text-editor
# or
yarn add @abduljebar/text-editor
# or
pnpm add @abduljebar/text-editor
```

## 🚀 Quick Start

```tsx
import '@abduljebar/text-editor/dist/index.css';
import { TextEditor } from "@abduljebar/text-editor";

function App() {
  return (
    <TextEditor
      height="500px"
      onChange={(content, html, title) => {
        console.log("Content:", content);
        console.log("HTML:", html);
        console.log("Title:", title);
      }}
      initialContent="<h1>Welcome to Your Document</h1><p>Start editing here...</p>"
    />
  );
}
```

## 📖 Basic Usage

### Simple Implementation

```tsx
import '@abduljebar/text-editor/dist/index.css';
import { TextEditor } from "@abduljebar/text-editor";

function MyEditor() {
  const handleSave = (content: string, html: string) => {
    // Save to your backend or state management
    console.log("Saving:", { content, html });
  };

  const handleExport = (html: string) => {
    // Export as HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
  };

  return (
    <TextEditor
      showButtons={true}
      showSaveTitle={true}
      showStatusBar={true}
      onSave={handleSave}
      onExport={handleExport}
      onChange={(content, html, title) => {
        // Real-time updates
        console.log("Changes:", { content, html, title });
      }}
    />
  );
}
```

### Read-only Mode

```tsx
import '@abduljebar/text-editor/dist/index.css';
import { TextEditor } from "@abduljebar/text-editor";

function ReadOnlyView() {
  return (
    <TextEditor
      readOnly={true}
      initialContent="<h1>Published Article</h1><p>This content cannot be edited.</p>"
      showStatusBar={true}
    />
  );
}
```

### With Image Upload

```tsx
import '@abduljebar/text-editor/dist/index.css';
import { TextEditor } from "@abduljebar/text-editor";

function EditorWithImages() {
  const handleImageUpload = async (file: File) => {
    // Upload to your backend
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    return data.url; // Return the uploaded image URL
  };

  return (
    <TextEditor
      showButtons={true}
      onImageUpload={handleImageUpload}
      allowedImageTypes={['image/jpeg', 'image/png', 'image/webp']}
      maxImageSize={10 * 1024 * 1024} // 10MB
    />
  );
}
```

## ⚙️ API Reference

### TextEditor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialContent` | `string` | `""` | Initial HTML content for the editor |
| `onChange` | `(content: string, html: string, title?: string) => void` | `undefined` | Callback when content changes |
| `onSave` | `(content: string, html: string) => void` | `undefined` | Callback when save is triggered |
| `onExport` | `(html: string) => void` | `undefined` | Callback when export is triggered |
| `onImageUpload` | `(file: File) => Promise<string>` | `undefined` | Custom image upload handler |
| `imageUploadEndpoint` | `string` | `undefined` | Endpoint for default image upload |
| `readOnly` | `boolean` | `false` | Disable editing when true |
| `showButtons` | `boolean` | `false` | Show save/export buttons |
| `showSaveTitle` | `boolean` | `false` | Show document title input |
| `showStatusBar` | `boolean` | `false` | Show word/character count |
| `height` | `string` | `"500px"` | Editor height (any CSS value) |
| `allowedImageTypes` | `string[]` | `["image/jpeg","image/png","image/gif","image/webp"]` | Allowed image MIME types |
| `maxImageSize` | `number` | `5242880` (5MB) | Maximum image size in bytes |
| `debounceDelay` | `number` | `300` | Debounce delay for onChange in ms |
| `className` | `string` | `""` | Additional CSS class name |
| `placeholder` | `string` | `"Start typing here..."` | Placeholder text when empty |
| `autoFocus` | `boolean` | `false` | Auto-focus editor on load |
| `onInit` | `(editor: HTMLDivElement) => void` | `undefined` | Callback after editor initialization |

### TextEditor Ref API

The component exposes a ref with the following methods:

```typescript
interface TextEditorRef {
  getContent: () => string;
  getHTML: () => string;
  getTitle: () => string;
  clear: () => void;
  focus: () => void;
  insertText: (text: string) => void;
  insertHTML: (html: string) => void;
  executeCommand: (command: string, value?: string) => void;
}
```

Example usage:
```tsx
import { useRef } from 'react';
import { TextEditor, TextEditorRef } from "@abduljebar/text-editor";

function EditorWithRef() {
  const editorRef = useRef<TextEditorRef>(null);

  const handleGetContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      const html = editorRef.current.getHTML();
      console.log({ content, html });
    }
  };

  return (
    <>
      <TextEditor ref={editorRef} />
      <button onClick={handleGetContent}>Get Content</button>
    </>
  );
}
```

### useTextEditor Hook

For advanced usage and custom implementations:

```tsx
import '@abduljebar/text-editor/dist/index.css';
import { useTextEditor } from "@abduljebar/text-editor";

function CustomEditor() {
  const {
    editorState,
    editorRef,
    updateContent,
    updateTitle,
    executeCommand,
    getValidationResult,
    exportToHTML,
    clearEditor,
    handlePaste,
    handleDrop,
    insertImage,
    uploadPendingImages,
  } = useTextEditor({
    initialContent: "Initial content",
    onImageUpload: async (file) => {
      // Custom upload logic
      return "https://example.com/image.jpg";
    },
    allowedImageTypes: ["image/jpeg", "image/png"],
    maxImageSize: 10 * 1024 * 1024,
  });

  return (
    <div>
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => updateContent(e.currentTarget.innerHTML)}
        className="border p-4 min-h-[200px]"
        onPaste={handlePaste}
        onDrop={handleDrop}
      />
      <button onClick={() => executeCommand('bold')}>
        Bold
      </button>
      <button onClick={() => insertImage(someFile)}>
        Insert Image
      </button>
    </div>
  );
}
```

#### Hook Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `initialContent` | `string` | `""` | Initial HTML content |
| `onImageUpload` | `(file: File) => Promise<string>` | `undefined` | Custom image upload handler |
| `imageUploadEndpoint` | `string` | `undefined` | Endpoint for default image upload |
| `allowedImageTypes` | `string[]` | `["image/jpeg","image/png","image/gif","image/webp"]` | Allowed image types |
| `maxImageSize` | `number` | `5242880` | Max image size in bytes |

#### Hook Return Values

| Property | Type | Description |
|----------|------|-------------|
| `editorState` | `object` | Current editor state with content, title, counts, pending images |
| `editorRef` | `RefObject<HTMLDivElement>` | Reference to the editable element |
| `updateContent` | `(content: string) => void` | Update editor content |
| `updateTitle` | `(title: string) => void` | Update document title |
| `executeCommand` | `(command: string, value?: string) => void` | Execute formatting commands |
| `getValidationResult` | `() => ValidationResult` | Validate and get editor data |
| `exportToHTML` | `(options?) => string` | Generate HTML export |
| `clearEditor` | `() => void` | Clear all content |
| `handlePaste` | `(e: React.ClipboardEvent) => void` | Handle paste events |
| `handleDrop` | `(e: React.DragEvent) => void` | Handle drop events |
| `insertImage` | `(file: File, atCursor?: boolean) => Promise<void>` | Insert image into editor |
| `uploadPendingImages` | `() => Promise<void>` | Upload all pending images |

## 🎨 Styling & Customization

### Default Styling

The editor comes with beautiful default styling:

- **Headings**: Proper hierarchy with appropriate sizing
- **Paragraphs**: Optimal line height and margins
- **Lists**: Clean indentation and spacing
- **Code Blocks**: Proper monospace fonts
- **Quotes**: Elegant bordered design
- **Links**: Proper styling with hover effects
- **Images**: Responsive with rounded corners

### Custom Styling

You can override the default styles by targeting the editor's CSS classes or using the `className` prop:

```tsx
import '@abduljebar/text-editor/dist/index.css';
import { TextEditor } from "@abduljebar/text-editor";

<TextEditor
  className="my-custom-editor"
  // ... other props
/>
```

```css
.my-custom-editor {
  border: 2px solid #4f46e5;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.my-custom-editor h1 {
  color: #4f46e5;
  border-bottom: 2px solid #e0e7ff;
}

.my-custom-editor .toolbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 🔧 Advanced Examples

### Integration with Form Libraries

```tsx
import '@abduljebar/text-editor/dist/index.css';
import { useForm } from 'react-hook-form';
import { TextEditor } from "@abduljebar/text-editor";

function ArticleForm() {
  const { register, handleSubmit, setValue, watch } = useForm();
  
  const handleEditorChange = (content: string, html: string, title?: string) => {
    setValue('content', html);
    setValue('title', title);
  };

  return (
    <form onSubmit={handleSubmit(data => console.log(data))}>
      <TextEditor
        showSaveTitle={true}
        showButtons={true}
        onChange={handleEditorChange}
        onSave={(content, html) => {
          // Handle form submission
          handleSubmit(data => console.log(data))();
        }}
      />
    </form>
  );
}
```

### Custom Toolbar Implementation

```tsx
import '@abduljebar/text-editor/dist/index.css';
import { useTextEditor } from "@abduljebar/text-editor";

function CustomToolbarEditor() {
  const { executeCommand, editorRef, insertImage } = useTextEditor({
    initialContent: "Start typing...",
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      insertImage(file);
    }
  };

  return (
    <div className="editor-container">
      <div className="custom-toolbar">
        <button onClick={() => executeCommand('bold')}>Bold</button>
        <button onClick={() => executeCommand('italic')}>Italic</button>
        <button onClick={() => executeCommand('formatBlock', 'h1')}>H1</button>
        <button onClick={() => executeCommand('formatBlock', 'h2')}>H2</button>
        <input type="file" accept="image/*" onChange={handleFileSelect} />
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="editor-content"
      />
    </div>
  );
}
```

### Programmatic Control

```tsx
import { useRef, useEffect } from 'react';
import { TextEditor, TextEditorRef } from "@abduljebar/text-editor";

function ProgrammaticEditor() {
  const editorRef = useRef<TextEditorRef>(null);

  useEffect(() => {
    // Example: Auto-insert content after 2 seconds
    const timer = setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.insertText("Hello, world!");
        editorRef.current.focus();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleCommand = (command: string) => {
    if (editorRef.current) {
      editorRef.current.executeCommand(command);
    }
  };

  return (
    <div>
      <TextEditor ref={editorRef} />
      <div className="mt-4">
        <button onClick={() => handleCommand('bold')}>Make Selection Bold</button>
        <button onClick={() => editorRef.current?.clear()}>Clear Editor</button>
      </div>
    </div>
  );
}
```

## 📋 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Opera 47+

## 🔒 Accessibility

- Keyboard navigation support
- ARIA labels for toolbar buttons
- Focus management
- Screen reader compatible
- Proper semantic HTML structure

## 🐛 Troubleshooting

### Common Issues

1. **Toolbar buttons not working**: Ensure the editor is focused and content is selected
2. **Images not uploading**: Check CORS settings and upload endpoint configuration
3. **Styles not appearing**: Import the CSS file: `import '@abduljebar/text-editor/dist/index.css';`
4. **Content not saving**: Check `onSave` callback and validation messages
5. **Formatting lost on paste**: Use the built-in `handlePaste` function

### Performance Tips

- Use appropriate `debounceDelay` for `onChange` to prevent excessive updates
- Implement proper image compression before upload
- Consider using `React.memo` if embedding in frequently re-rendering components
- Use the ref API for programmatic control instead of frequent state updates

## 📄 Supported Commands

The editor supports standard `document.execCommand` APIs:

- **Formatting**: `bold`, `italic`, `underline`, `strikeThrough`
- **Headings**: `formatBlock` (with `h1`, `h2`, `h3`, `p` values)
- **Lists**: `insertUnorderedList`, `insertOrderedList`
- **Alignment**: `justifyLeft`, `justifyCenter`, `justifyRight`
- **Indentation**: `indent`, `outdent`
- **Links**: `createLink` (with URL value)
- **History**: `undo`, `redo`
- **Special**: `superscript`, `subscript`, `formatBlock` (with `blockquote`, `pre` values)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the documentation above
2. Search existing GitHub issues
3. Create a new issue with:
   - A clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Code examples if applicable

## 🚀 Changelog

### v1.1.0
- Added image upload support with drag & drop
- Improved toolbar with better selection tracking
- Added ref API for programmatic control
- Enhanced keyboard shortcuts
- Better validation and error handling
- Added pending images tracking

### v1.0.0
- Initial release with core editing features
- Basic text formatting and styling
- HTML export functionality
- React hook for advanced usage

---

Built with ❤️ by [AbdulJebar Sani](https://github.com/abduljebar49)

## 🔗 Links

- [GitHub Repository](https://github.com/abduljebar/text-editor)
- [npm Package](https://www.npmjs.com/package/@abduljebar/text-editor)
- [Issue Tracker](https://github.com/abduljebar/text-editor/issues)
- [Documentation](https://github.com/abduljebar/text-editor#readme)