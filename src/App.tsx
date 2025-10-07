//App.tsx
import { TextEditor } from './components/TextEditor';

function App() {
  const handleSave = (content: string, html: string) => {
    console.log('Content saved:', content);
    console.log('HTML exported:', html);
    alert('Document saved successfully!');
  };

  const handleExport = (html: string) => {
    console.log('HTML for export:', html);
    alert('HTML file downloaded!');
  };

  return (
    // <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
    //   <div className="max-w-7xl mx-auto">
    //     <header className="text-center mb-12">
    //       <h1 className="text-4xl font-bold text-gray-800 mb-4">
    //         Advanced Text Editor
    //       </h1>
    //       <p className="text-xl text-gray-600 max-w-2xl mx-auto">
    //         Create rich text content with real-time validation and export as beautiful HTML documents
    //       </p>
    //     </header>
        
    //     <main>
          <TextEditor
            onSave={handleSave}
            onExport={handleExport}
          />
    //     </main>
        
    //     <footer className="text-center mt-12 text-gray-500 text-sm">
    //       <p>Built with React, TypeScript, Tailwind CSS, and Zod</p>
    //     </footer>
    //   </div>
    // </div>
  );
}

export default App;