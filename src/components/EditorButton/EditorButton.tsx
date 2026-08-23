type EditorButtonProps = {
  label: string;
  icon: string;
  iconClassName?: string;
  disabled?: boolean;
  isActive?: boolean;
  onClick: () => void;
};

/** Renders an accessible button for a rich-text editor action. */
export default function EditorButton({
  label,
  icon,
  iconClassName,
  disabled = false,
  isActive = false,
  onClick,
}: EditorButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      className={isActive ? 'is-active' : undefined}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <span aria-hidden="true" className={`toolbar-icon ${iconClassName ?? ''}`.trim()}>
        {icon}
      </span>
    </button>
  );
}
