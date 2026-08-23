# Decisions

## Mark Boundaries

### Bold and Italic Toggle

Bold and Italic are applied to the selected text range. If every selected character already has the requested mark, toggling removes it from the range. Otherwise, the mark is added to the complete selected range.

For a partially formatted selection, the command applies the mark to the entire selection. This gives the toolbar a predictable toggle behavior: a mixed selection becomes consistently formatted after one click.

A collapsed selection does not change existing text. The current implementation does not maintain a future typing mark at the caret.

### Link Behavior

Link uses the same selected-range behavior as other marks. The toolbar opens a URL popover, trims the submitted URL, and applies it as a link mark to the selected text. Empty URLs are ignored. Link marks store both their type and `href` value.

## Run Boundaries

Text is stored in runs so formatting boundaries remain explicit. When an operation affects only part of a run, the run is divided into unformatted and formatted pieces as needed. Normalization merges adjacent runs only when their mark collections are equivalent.

## Newlines and Blocks

The editor currently presents one editable block. Pressing Enter inserts a newline character into that block rather than creating a second block. The newline is preserved in the model and rendered with `white-space: pre-wrap`.

The model retains block-oriented types so the document structure can evolve to support multiple blocks later without changing the core run and selection concepts.

## Selection

Selections are represented by anchor and focus points containing a block ID and character offset. Selection ranges are normalized and clamped against the current document before model operations run. When the model changes, the selection is converted back to DOM positions and restored after rendering.

## History Coalescing

Each document-changing action records a snapshot containing the document and selection. Undo moves the current snapshot to the future stack and restores the latest past snapshot. Redo performs the inverse operation.

The history utility supports coalescing entries with the same `groupId` within a 400 ms window. Current editor actions do not assign a group ID, so each committed document change is currently a separate history entry. A future typing implementation could assign a shared group ID to consecutive compatible insertions.

Selection-only updates do not create history entries. New edits clear the redo stack.

## Explicit Scope

IME composition and complex HTML paste behavior are not implemented for this take-home. They should be addressed separately with composition-aware input handling and sanitized clipboard parsing in a production editor.
