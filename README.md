# @abduljebar/text-editor

A modern, feature-rich React text editor component with beautiful styling and extensive customization options. Perfect for blogs, content management systems, and any application requiring rich text editing capabilities.

## ✨ Features

### 🎨 Rich Text Editing
- **Text Formatting**: Bold, italic, underline, strikethrough
- **Color Support**: 20 text colors & 25 background colors with intuitive pickers
- **Headings**: H1, H2, H3 with automatic styling
- **Lists**: Bulleted and numbered lists
- **Block Elements**: Quotes and code blocks with syntax styling
- **Undo/Redo**: Full history support

### 🎯 Smart UX
- **Auto-styling**: Automatic application of beautiful Tailwind CSS styles
- **Contextual Toolbar**: Appears only when focused and editable
- **Real-time Stats**: Word and character count in status bar
- **Smart Format Detection**: Visual indicators for active text formats
- **Tab Support**: Indentation with Tab key

### 🔧 Flexible Configuration
- **Read-only Mode**: Display content without editing capabilities
- **Customizable Height**: Flexible sizing options
- **Title Support**: Optional document title with real-time updates
- **Action Buttons**: Built-in save and export functionality
- **Event Handling**: Comprehensive callback system

### 🚀 Advanced Features
- **React Hook**: `useTextEditor` for custom implementations
- **HTML Export**: Generate complete HTML documents
- **Validation**: Built-in content validation
- **State Management**: Full control over editor state
- **TypeScript**: Fully typed for better development experience

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
import { TextEditor } from "@abduljebar/text-editor";

function App() {
  return (
    <TextEditor
      height="min-h-[400px]"
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

## ⚙️ API Reference

### TextEditor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialContent` | `string` | `""` | Initial HTML content for the editor |
| `onChange` | `(content: string, html: string, title?: string) => void` | `undefined` | Callback when content changes |
| `onSave` | `(content: string, html: string) => void` | `undefined` | Callback when save is triggered |
| `onExport` | `(html: string) => void` | `undefined` | Callback when export is triggered |
| `readOnly` | `boolean` | `false` | Disable editing when true |
| `showButtons` | `boolean` | `false` | Show save/export buttons |
| `showSaveTitle` | `boolean` | `false` | Show document title input |
| `showStatusBar` | `boolean` | `false` | Show word/character count |
| `height` | `string` | `"500px"` | Editor height (any CSS value) |

### useTextEditor Hook

For advanced usage and custom implementations:

```tsx
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
    resetToInitial,
    activeFormats,
    isLinkActive,
  } = useTextEditor("Initial content", false);

  // Use the state and methods to build custom UI
  return (
    <div>
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => updateContent(e.currentTarget.innerHTML)}
        className="border p-4 min-h-[200px]"
      />
      <button onClick={() => executeCommand('bold')}>
        Bold
      </button>
    </div>
  );
}
```

#### Hook Return Values

| Property | Type | Description |
|----------|------|-------------|
| `editorState` | `object` | Current editor state (content, title, counts) |
| `editorRef` | `RefObject` | Reference to the editable element |
| `updateContent` | `(content: string) => void` | Update editor content |
| `updateTitle` | `(title: string) => void` | Update document title |
| `executeCommand` | `(command: string, value?: string) => void` | Execute formatting commands |
| `getValidationResult` | `() => ValidationResult` | Validate and get editor data |
| `exportToHTML` | `(options?) => string` | Generate HTML export |
| `clearEditor` | `() => void` | Clear all content |
| `resetToInitial` | `() => void` | Reset to initial content |
| `activeFormats` | `object` | Current active text formats |
| `isLinkActive` | `boolean` | Whether a link is currently selected |

## 🎨 Styling & Customization

### Default Styling

The editor comes with beautiful default styling using Tailwind CSS classes:

- **Headings**: Proper hierarchy with borders and spacing
- **Paragraphs**: Optimal line height and margins
- **Lists**: Clean indentation and spacing
- **Code Blocks**: Dark theme with proper monospace fonts
- **Quotes**: Elegant bordered design
- **Links**: Blue color with hover effects

### Custom Styling

You can override the default styles by targeting the editor's CSS classes or using the `className` prop:

```tsx
<TextEditor
  className="custom-editor-styles"
  // ... other props
/>
```

```css
.custom-editor-styles {
  /* Your custom styles */
}

.custom-editor-styles h1 {
  /* Custom heading styles */
}
```

## 🔧 Advanced Examples

### Integration with Form Libraries

```tsx
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
import { useTextEditor } from "@abduljebar/text-editor";

function CustomToolbarEditor() {
  const { executeCommand, activeFormats, editorRef } = useTextEditor();

  return (
    <div className="editor-container">
      <div className="custom-toolbar">
        <button 
          onClick={() => executeCommand('bold')}
          className={activeFormats.bold ? 'active' : ''}
        >
          B
        </button>
        <button 
          onClick={() => executeCommand('italic')}
          className={activeFormats.italic ? 'active' : ''}
        >
          I
        </button>
        {/* Add more custom buttons */}
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

## 🌈 Color Palettes

### Text Colors (20 colors)
- Basic: Black, White
- Primary: Red, Green, Blue
- Secondary: Yellow, Magenta, Cyan, Orange, Purple
- Additional: Dark Green, Maroon, Teal, Navy, Gray, Brown, Pink, Gold, Light Green, Light Blue

### Background Colors (25 colors)
- Same as text colors plus light variants
- Light variants: Misty Rose, Honeydew, Alice Blue, Lemon Chiffon, White Smoke, Lavender, and more

## 📋 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🔒 Accessibility

- Keyboard navigation support
- ARIA labels for toolbar buttons
- Focus management
- Screen reader compatible

## 🐛 Troubleshooting

### Common Issues

1. **Content not updating**: Ensure you're using the `onChange` callback properly
2. **Styles not applying**: Make sure Tailwind CSS is properly configured in your project
3. **Toolbar not appearing**: Check that `readOnly` is set to `false` and the editor is focused

### Performance Tips

- Use `React.memo` if embedding in frequently re-rendering components
- Debounce `onChange` callbacks for heavy operations
- Consider using the hook version for complex custom implementations

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [documentation](#)
2. Search [existing issues](https://github.com/abduljebar/text-editor/issues)
3. Create a [new issue](https://github.com/abduljebar/text-editor/issues/new)

## 🚀 Changelog

### v1.0.0
- Initial release with core editing features
- Comprehensive text formatting options
- Color support and styling system
- React hook for advanced usage

---

Built with ❤️ by [AbdulJebar Sani](https://github.com/abduljebar49)