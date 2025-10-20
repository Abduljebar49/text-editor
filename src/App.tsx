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
    />
  );
}

export default App;
