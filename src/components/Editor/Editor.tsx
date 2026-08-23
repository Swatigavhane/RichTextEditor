import Block from '../Block/Block';
import Toolbar from '../Toolbar/Toolbar';
import { useEditorContext } from '../../hooks';
import type { Document } from '../../model';

export default function Editor() {
  const editorViewModel = useEditorContext();
  const formattedDocument = JSON.stringify(
    JSON.parse(editorViewModel.serializedDocument),
    null,
    2,
  );

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">React + TypeScript</p>
        <h1>Rich Text Editor</h1>
        <p className="lead">This layout now follows the requested folder structure.</p>
        <Toolbar />
        {editorViewModel.documentModel.blocks.map((block: Document['blocks'][number]) => (
          <Block key={block.id} block={block} />
        ))}
        <pre className="document-preview">{formattedDocument}</pre>
      </section>
    </main>
  );
}
