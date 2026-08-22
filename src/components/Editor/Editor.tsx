import Block from '../Block/Block';
import Toolbar from '../Toolbar/Toolbar';
import { useEditor } from './useEditor';

export default function Editor() {
    const editor = useEditor();

    return (
        <main className="app-shell">
            <section className="hero-card">
                <p className="eyebrow">React + TypeScript</p>
                <h1>Rich Text Editor</h1>
                <p className="lead">This layout now follows the requested folder structure.</p>
                <Toolbar
                    activeMarks={editor.activeMarks}
                    onToggleBold={editor.toggleBold}
                    onToggleItalic={editor.toggleItalic}
                    onInsertLink={editor.insertLink}
                />
                {editor.documentModel.blocks.map((block) => (
                    <Block key={block.id} block={block} />
                ))}
                <pre className="document-preview">{editor.serializedDocument}</pre>
            </section>
        </main>
    );
}