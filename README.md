# Rich Text Editor

A small rich text editor built with React, TypeScript, and Vite. The editor uses a document model with text runs and inline marks, while React context and a reducer manage editing state.

## Features

- Editable single-block writing surface
- Bold, italic, and link formatting
- Undo and redo history
- Selection-aware toolbar state
- Enter inserts a newline in the current block
- Live word count
- Document normalization and JSON serialization
- HTML escaping when rendering editable content
- Unit tests for model, selection, history, and reconciliation logic

## Requirements

- Node.js 18 or newer
- npm

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite in your browser.

## Available Commands

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Start the Vite development server          |
| `npm run build`        | Type-check and build the production bundle |
| `npm run preview`      | Preview the production build locally       |
| `npm run typecheck`    | Run TypeScript without emitting files      |
| `npm run lint`         | Check source files with ESLint             |
| `npm run lint:fix`     | Automatically fix supported lint issues    |
| `npm run format`       | Format the project with Prettier           |
| `npm run format:check` | Check formatting without changing files    |
| `npm test`             | Run the Vitest test suite once             |
| `npm run test:watch`   | Run Vitest in watch mode                   |

## How It Works

The editor stores content as a document containing blocks. Each block contains text runs, and each run can contain inline marks such as `bold`, `italic`, or a link object.

The application state is managed by `editorReducer` and exposed through `EditorProvider`. Components such as the toolbar and editable block use `useEditorContext()` to read state and dispatch commands without passing editor state through multiple component props.

Input changes are reconciled by comparing the previous and current text values. The resulting diff is applied to the document model, the caret is normalized, and the change is added to the history stack. Undo and redo restore both the document and its selection.

## Project Structure

```text
src/
   components/
      Block/       Editable document block
      Editor/      Editor workspace
      Toolbar/     Formatting and history controls
   editor-core/
      commands.ts  Editor command definitions
      history/     Undo and redo stack
      reconciler/  DOM input diffing and model updates
      selection/   DOM and model selection conversions
   hooks/
      useEditor.ts Editor context and reducer integration
      editor/      State, actions, reducer, and selectors
   model/
      blocks/      Block operations
      document/    Document creation, validation, and normalization
      marks/       Inline mark operations
      runs/        Text-run operations
   utils/         Test and model construction helpers
```

## Testing

Run the complete test suite with:

```bash
npm test
```

The tests cover document normalization, text replacement, mark operations, selection conversion, history behavior, and input reconciliation.
