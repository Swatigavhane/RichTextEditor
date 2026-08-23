import Block from '../Block/Block';
import Toolbar from '../Toolbar/Toolbar';
import { useEditor } from '../../hooks';
import { getDocumentText } from '../../model';

/** Renders the toolbar, editable block, and live word count. */
export default function Editor() {
  const editorViewModel = useEditor();
  const wordCount = getDocumentText(editorViewModel.documentModel)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <main className="app-shell">
      <section className="editor-shell">
        <Toolbar
          activeMarks={editorViewModel.activeMarks}
          runCommand={editorViewModel.runCommand}
          applyLink={editorViewModel.applyLink}
          selection={editorViewModel.selection}
          canUndo={editorViewModel.canUndo}
          canRedo={editorViewModel.canRedo}
        />
        <div className="editor-canvas">
          <Block
            block={editorViewModel.documentModel.blocks[0]}
            selection={editorViewModel.selection}
            applyInput={editorViewModel.applyInput}
            setSelection={editorViewModel.setSelection}
            insertNewline={editorViewModel.insertNewline}
            insertText={editorViewModel.insertText}
          />
        </div>
        <footer className="editor-footer">
          <span>{`${wordCount} words`}</span>
        </footer>
      </section>
    </main>
  );
}
