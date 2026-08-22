import { createEmptyDocument, serializeDocument } from '../model';

export default function EditorStarter() {
    const documentModel = createEmptyDocument();

    return (
        <main className="app-shell">
            <section className="hero-card">
                <p className="eyebrow">React + TypeScript</p>
                <h1>Rich Text Editor</h1>
                <p className="lead">
                    This scaffold now has a strict TypeScript foundation and a JSON-serializable document model.
                </p>
                <pre className="document-preview">{serializeDocument(documentModel)}</pre>
            </section>
        </main>
    );
}