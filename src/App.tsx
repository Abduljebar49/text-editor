//App.tsx
import { TextEditor } from "./components/TextEditor";

function App() {
  return (
    <TextEditor
      height={"min-h-[400px]"}
      onChange={(content, html, title) => {
        console.log("Content changed:", content);
        console.log("HTML changed:", html);
        console.log("title : ", title);
      }}
      initialContent=" The following is text<div><br></div><h1>Header 1</h1><div><br></div><h2>Header 2</h2><div><br></div><div>another example,&nbsp;<br><br>underlined<br><br>bold<br><br><br></div>"
    />
  );
}

export default App;
