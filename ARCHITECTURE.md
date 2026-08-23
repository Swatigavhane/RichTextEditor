# Architecture

## Overview

This editor uses a JSON-serializable document model as the single source of truth. The browser `contenteditable` element is an input surface and a projection of that model; it is not treated as persistent application state.

## Document Model

A document contains paragraph blocks. Each block contains ordered text runs:

```ts
type Document = {
  blocks: Array<{
    type: 'paragraph';
    id: string;
    children: Array<{
      text: string;
      marks: Array<'bold' | 'italic' | { type: 'link'; href: string }>;
    }>;
  }>;
};
```

Documents are normalized so empty runs are removed, adjacent runs with equivalent marks are merged, and an empty document always has a valid paragraph. Documents can be serialized to JSON and reconstructed through the document API.

## State Management

`EditorProvider` owns the reducer-backed editor state and exposes it through `useEditorContext()`. The state contains:

- The current document model
- The current selection using block IDs and offsets
- Undo/redo history snapshots

Commands and input events are dispatched as typed reducer actions. Document changes are committed through one path that normalizes the selection and records a history snapshot.

## DOM Reconciliation

When the browser changes the editable block, the input handler reads the current DOM text and selection. `diffText` identifies the smallest changed range, and `applyInputEvent` applies that change to the model through the model replacement operation. The reducer then updates the model, calculates the new caret position, and records the change.

The block renders marked runs as escaped HTML. After a model update replaces the editable DOM contents, a layout effect maps model offsets back to the correct nested DOM text nodes and restores the browser selection. This keeps selection mapping accurate across typing, deletion, Enter, and toolbar changes.

Enter is handled as a dedicated newline action. It inserts `\\n` into the current block instead of creating another block, matching the current single-block editor behavior.

## Toolbar

The toolbar reads selection state and command handlers from context. Formatting commands apply marks to the selected range. The Link command opens a URL popover and applies a link mark with the submitted URL. Undo and redo restore both the document and selection from history snapshots.

## Out of Scope

Complex IME composition and robust HTML paste sanitization are intentionally out of scope for this take-home implementation.

For production, IME support would use composition event state and defer reconciliation until composition is committed, avoiding interference with partially composed text. Paste handling would inspect clipboard formats, prefer sanitized plain text or a strict allowlist of HTML elements and attributes, and reject unsafe URLs and event-handler attributes before inserting content into the model.
