import Block from '../Block/Block';
import Toolbar from '../Toolbar/Toolbar';
import { useEditorContext } from '../../hooks';
import { getDocumentText } from '../../model';

export default function Editor() {
  // Reads document state from context and renders the editor workspace.
  const editorViewModel = useEditorContext();
  const wordCount = getDocumentText(editorViewModel.documentModel)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <main className="app-shell">
      <section className="editor-shell">
        <Toolbar />
        <div className="editor-canvas">
          <Block block={editorViewModel.documentModel.blocks[0]} />
        </div>
        <footer className="editor-footer">
          <span>{`${wordCount} words`}</span>
        </footer>
        {/* <pre className="document-preview">{formattedDocument}</pre> */}
      </section>
    </main>
  );
}
