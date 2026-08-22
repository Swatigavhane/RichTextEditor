import Block from '../Block/Block';
import Toolbar from '../Toolbar/Toolbar';
import { useEditor } from '../../hooks/useEditor';
import type { Document } from '../../model';

export default function Editor() {
  const editorViewModel = useEditor();

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">React + TypeScript</p>
        <h1>Rich Text Editor</h1>
        <p className="lead">This layout now follows the requested folder structure.</p>
        <Toolbar
          commands={editorViewModel.toolbarCommands}
          onRunCommand={editorViewModel.runCommand}
        />
        {editorViewModel.documentModel.blocks.map((block: Document['blocks'][number]) => (
          <Block key={block.id} block={block} />
        ))}
        <pre className="document-preview">{editorViewModel.serializedDocument}</pre>
      </section>
    </main>
  );
}
