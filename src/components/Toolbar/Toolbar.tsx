import type { EditorCommandId } from '../../hooks/constants';

type ToolbarCommand = {
  id: EditorCommandId;
  label: string;
  isActive: boolean;
};

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
