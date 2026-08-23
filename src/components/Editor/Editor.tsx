import Block from '../Block/Block';
import Toolbar from '../Toolbar/Toolbar';
import { useEditorContext } from '../../hooks';
import { getDocumentText } from '../../model';

/** Renders the toolbar, editable block, and live word count. */
export default function Editor() {
  const editorViewModel = useEditorContext();
  const wordCount = getDocumentText(editorViewModel.documentModel)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  console.log('documentModel =', editorViewModel.documentModel);
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
      </section>
    </main>
  );
}
