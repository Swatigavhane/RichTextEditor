import { EditorCommand } from '../../editor-core/commands';
import type { ActiveMarkId, EditorCommandId } from '../../editor-core/commands';
import { useEditorContext } from '../../hooks';

type ToolbarButton = {
  command: EditorCommandId;
  label: string;
  mark: ActiveMarkId | null;
};

const toolbarButtons: ToolbarButton[] = [
  { command: EditorCommand.TOGGLE_BOLD, label: 'Bold', mark: 'bold' },
  { command: EditorCommand.TOGGLE_ITALIC, label: 'Italic', mark: 'italic' },
  { command: EditorCommand.SET_LINK, label: 'Link', mark: 'link' },
  { command: EditorCommand.UNDO, label: 'Undo', mark: null },
  { command: EditorCommand.REDO, label: 'Redo', mark: null },
];

const isCommandDisabled = (
  command: EditorCommandId,
  canUndo: boolean,
  canRedo: boolean,
): boolean => {
  if (command === EditorCommand.UNDO) {
    return !canUndo;
  }

  if (command === EditorCommand.REDO) {
    return !canRedo;
  }

  return false;
};

export default function Toolbar() {
  const { activeMarks, runCommand, canUndo, canRedo } = useEditorContext();

  return (
    <div className="editor-toolbar">
      {toolbarButtons.map(({ command, label, mark }) => (
        <button
          key={command}
          type="button"
          aria-pressed={mark ? activeMarks.includes(mark) : undefined}
          disabled={isCommandDisabled(command, canUndo, canRedo)}
          onClick={() => runCommand(command)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
