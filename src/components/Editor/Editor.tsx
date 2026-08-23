import Block from '../Block/Block';
import Toolbar from '../Toolbar/Toolbar';
import { useEditorContext } from '../../hooks';
import { getDocumentText } from '../../model';
import type { Document } from '../../model';

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
          {editorViewModel.documentModel.blocks.map((block: Document['blocks'][number]) => (
            <Block key={block.id} block={block} />
          ))}
        </div>
        <footer className="editor-footer">
          <span>{`${wordCount} words`}</span>
        </footer>
        {/* <pre className="document-preview">{formattedDocument}</pre> */}
      </section>
    </main>
  );
}
