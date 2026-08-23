import { EditorCommand } from '../../editor-core/commands';
import type { ActiveMarkId, EditorCommandId } from '../../editor-core/commands';
import { useEditorContext } from '../../hooks';

type ToolbarButton = {
  command: EditorCommandId;
  label: string;
  icon: string;
  mark: ActiveMarkId | null;
};

const toolbarButtons: ToolbarButton[] = [
  { command: EditorCommand.TOGGLE_BOLD, label: 'Bold', icon: 'B', mark: 'bold' },
  { command: EditorCommand.TOGGLE_ITALIC, label: 'Italic', icon: 'I', mark: 'italic' },
  { command: EditorCommand.SET_LINK, label: 'Link', icon: 'Link', mark: 'link' },
  { command: EditorCommand.UNDO, label: 'Undo', icon: 'Undo', mark: null },
  { command: EditorCommand.REDO, label: 'Redo', icon: 'Redo', mark: null },
];

/** Returns whether a toolbar command is unavailable in the current history state. */
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

/** Renders formatting and history commands connected to the editor context. */
export default function Toolbar() {
  const { activeMarks, runCommand, canUndo, canRedo } = useEditorContext();

  return (
    <div className="editor-toolbar">
      <div className="toolbar-group" role="group" aria-label="Text formatting">
        {toolbarButtons.slice(0, 3).map(({ command, label, icon, mark }) => (
          <button
            key={command}
            type="button"
            aria-label={label}
            aria-pressed={mark ? activeMarks.includes(mark) : undefined}
            className={mark && activeMarks.includes(mark) ? 'is-active' : undefined}
            title={label}
            disabled={isCommandDisabled(command, canUndo, canRedo)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(command)}
          >
            <span
              aria-hidden="true"
              className={`toolbar-icon toolbar-icon-${command.toLowerCase()}`}
            >
              {icon}
            </span>
          </button>
        ))}
      </div>
      <span className="toolbar-divider" aria-hidden="true" />
      <div className="toolbar-group toolbar-history" role="group" aria-label="History">
        {toolbarButtons.slice(3).map(({ command, label, icon }) => (
          <button
            key={command}
            type="button"
            aria-label={label}
            title={label}
            disabled={isCommandDisabled(command, canUndo, canRedo)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(command)}
          >
            <span
              aria-hidden="true"
              className={`toolbar-icon toolbar-icon-${command.toLowerCase()}`}
            >
              {icon}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
