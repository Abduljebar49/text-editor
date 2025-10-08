import { TextEditor } from ".";

function App() {
  const initialContent = `
    <h1>Welcome to Text Editor</h1>
    <p>This is <strong>bold text</strong> and this is <em>italic text</em>.</p>
    <ul>
      <li>List item 1</li>
      <li>List item 2</li>
      <li>List item 3</li>
    </ul>
  `;

  return (
    <main>
      <TextEditor
        initialContent={initialContent}
        onChange={(content, html, title) => {
          console.log("Content changed:", { content, html, title });
          // Update your form state here
        }}
      />
    </main>
  );
}

export default App;
