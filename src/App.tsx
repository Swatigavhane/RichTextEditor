import Editor from './components/Editor';
import { EditorProvider } from './hooks';

export default function App() {
  return (
    <EditorProvider>
      <Editor />
    </EditorProvider>
  );
}
