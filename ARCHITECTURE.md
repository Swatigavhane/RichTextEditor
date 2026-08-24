# Architecture

## Overview

This editor follows one central principle:

> The document model is the single source of truth. The DOM is only an input surface and a projection of the model.

The editor does not treat `contenteditable.innerHTML` as application state. User interactions are interpreted as model operations, the document model is updated, and React renders the updated model back to the DOM.

This separation keeps document state deterministic and makes formatting, selection, undo/redo, serialization, and testing independent from the browser's DOM structure.

## Document Model

The document is represented as a JSON-serializable tree.

At the current scope, a document contains paragraph blocks and ordered text runs:

```ts
type Document = {
  blocks: Array<{
    type: "paragraph";
    id: string;
    children: Array<{
      text: string;
      marks: Array<
        "bold" |
        "italic" |
        {
          type: "link";
          href: string;
        }
      >;
    }>;
  }>;
};
```

A text run represents a contiguous piece of text that has the same set of inline marks.

For example:

```text
Hello **world**
```

is represented as:

```text
Text("Hello ")
Text("world", bold)
```

### Model invariants

The document is normalized after model operations:

- Empty text runs are removed.
- Adjacent text runs with equivalent marks are merged.
- A document always contains a valid paragraph.
- Formatting operations return a new normalized document rather than mutating the existing document.

Because the model is JSON-serializable, the document can be persisted and reconstructed without depending on the DOM.

## State Management

Editor state is managed locally by the `useEditor` hook using React's `useReducer`.

The editor state contains three core pieces:

- `documentModel` — the JSON document and the single source of truth for content.
- `selection` — the current editor selection represented using block IDs and offsets.
- `history` — undo/redo snapshots containing both the document and selection.

`useEditor` creates the reducer state and exposes a small view model to the
`Editor` component. `Editor` passes only the state and actions required by
the `Toolbar` and `Block` components.
The state flow is:

```text
Editor
  ↓
useEditor
  ↓
useReducer
  ↓
editorReducer
  ↓
Document + Selection + History
```

This prevents individual UI components from directly mutating the document.

## DOM as a Projection

The `contenteditable` element is intentionally not the source of truth.

The rendering direction is:

```text
Document Model
      ↓
React
      ↓
Editable Block
      ↓
DOM
```

Each model text run is rendered according to its marks:

```text
bold   → <strong>
italic → <em>
link   → <a>
```

The DOM structure can therefore change as formatting changes without changing the underlying representation of the document.

## DOM Input Reconciliation

Browser editing APIs operate on the DOM, while the application operates on the document model.

When the user edits the document:

```text
User input
    ↓
contenteditable
    ↓
Input handler
    ↓
Read DOM text + selection
    ↓
Calculate changed range
    ↓
Convert DOM position → model position
    ↓
Apply model operation
    ↓
Normalize model
    ↓
Update reducer state
    ↓
Render model → DOM
    ↓
Restore selection
```

The reconciler compares the previous and current text values to identify the smallest changed range. That change is then applied to the document model instead of accepting the DOM as the new source of truth.

## Selection Model

Browser selections are represented using DOM nodes and offsets. These values are tied to a particular DOM structure and therefore are not suitable as persistent editor state.

The editor stores selection using model coordinates:

```ts
type Position = {
  blockId: string;
  offset: number;
};

type Selection = {
  anchor: Position;
  focus: Position;
};
```

The selection has two conversion directions:

```text
DOM Selection
     ↓
DOM → Model
     ↓
Model Selection
```

and:

```text
Model Selection
     ↓
Model → DOM
     ↓
DOM Selection
```

This abstraction allows the document model to change without making the selection dependent on a particular DOM node.

After a model update, the editor maps the stored model offsets back to the appropriate DOM text nodes and restores the browser selection.

## Commands and Formatting

Formatting is implemented as model operations rather than DOM mutations.

For example:

```text
toggleMark(selection, "bold")
```

operates on the document model.

The toolbar therefore does not call DOM formatting APIs such as `document.execCommand()`.

Instead:

```text
Toolbar
   ↓
Command
   ↓
Reducer
   ↓
Model operation
   ↓
New document
   ↓
Render
```

This keeps formatting behavior deterministic and testable without requiring a browser DOM.

## History

Undo/redo stores document and selection together.

A history entry contains:

```ts
type HistoryEntry = {
  document: Document;
  selection: Selection;
};
```

This is necessary because restoring only the document would leave the cursor or selection in an incorrect position.

A new document-changing operation pushes the previous state into history and clears the redo stack.

Typing operations may be coalesced according to the rules defined in `DECISIONS.md`.

Undo and redo restore both the document model and model selection. The DOM selection is then reconstructed from the restored model selection.

## Toolbar

The toolbar reads editor state Props provided.

It provides:

- Bold
- Italic
- Link
- Undo
- Redo

Formatting buttons derive their active state from the current model selection rather than inspecting DOM styles.

The Link control applies a URL mark to the selected range.

## Runtime Flow

```text
                         ┌─────────────────┐
                         │ Document Model  │
                         │ Source of Truth │
                         └────────┬────────┘
                                  │
                                  ▼
                            React Render
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Editable Block  │
                         │  contenteditable│
                         └────────┬────────┘
                                  │
                         User interaction
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ DOM Reconciler  │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Editor Reducer  │
                         └────────┬────────┘
                                  │
                         Model Operation
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Document Model  │
                         └─────────────────┘

Toolbar commands ────────────────► Reducer

Model Selection ◄──────► DOM Selection

Document + Selection ────────────► History
```

## Main Responsibilities

| Area | Responsibility |
|---|---|
| `model/` | Document types, blocks, text runs, marks, normalization and model operations |
| `editor-core/reconciler/` | Converts browser text changes into model updates |
| `editor-core/selection/` | Converts between DOM and model selection coordinates |
| `editor-core/history/` | Stores document and selection snapshots for undo/redo |
| `editor-core/commands.ts` | Defines editor commands |
| `hooks/editor/` | Reducer state, actions, commands and selectors |
| `hooks/useEditor.ts` | Exposes editor state and actions through React context |
| `components/Block/` | Projects model content into the editable DOM and captures browser events |
| `components/Toolbar/` | Provides formatting, link and history controls |

## Testing Strategy

Core editor logic is kept independent from React and DOM rendering where possible.

Unit tests focus on:

- Document normalization.
- Text replacement.
- Mark application and removal.
- Selection calculations.
- DOM/model selection conversion.
- History behavior.
- Input reconciliation.

The goal is to test editor behavior and model transformations rather than relying on DOM snapshots.

## Out of Scope

Complex IME composition and robust HTML paste sanitization are intentionally out of scope for this take-home assignment.

For a production editor:

- IME input would be handled using composition event state and input transactions so that partially composed text is not incorrectly reconciled.
- Clipboard input would be parsed and normalized before entering the document model.
- HTML paste would use a strict allowlist of supported elements and attributes.
- URLs and other potentially unsafe attributes would be validated before being added to the model.

These concerns are deliberately isolated from the core model architecture so they can be added without making the DOM the source of truth.
