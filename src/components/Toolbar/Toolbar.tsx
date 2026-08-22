import type { EditorCommandId } from '../../editor-core/commands';
import type { ToolbarCommand } from '../../hooks/editor';

type ToolbarProps = {
  commands: ToolbarCommand[];
  onRunCommand: (command: EditorCommandId) => void;
};

export default function Toolbar({ commands, onRunCommand }: ToolbarProps) {
  return (
    <div className="editor-toolbar">
      {commands.map((command) => (
        <button
          key={command.id}
          type="button"
          aria-pressed={command.isActive}
          onClick={() => onRunCommand(command.id)}
        >
          {command.label}
        </button>
      ))}
    </div>
  );
}
