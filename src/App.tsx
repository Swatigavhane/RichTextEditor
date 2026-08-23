import Editor from './components/Editor';
import { EditorProvider } from './hooks';

// Provides the editor state context for the application.
export default function App() {
  return (
    <EditorProvider>
      <Editor />
    </EditorProvider>
  );
}
