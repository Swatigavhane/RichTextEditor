type ToolbarProps = {
  activeMarks: string[];
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onInsertLink: () => void;
};

export default function Toolbar({
  activeMarks,
  onToggleBold,
  onToggleItalic,
  onInsertLink,
}: ToolbarProps) {
  return (
    <div className="editor-toolbar">
      <button type="button" aria-pressed={activeMarks.includes('bold')} onClick={onToggleBold}>
        Bold
      </button>
      <button type="button" aria-pressed={activeMarks.includes('italic')} onClick={onToggleItalic}>
        Italic
      </button>
      <button type="button" onClick={onInsertLink}>
        Link
      </button>
    </div>
  );
}
