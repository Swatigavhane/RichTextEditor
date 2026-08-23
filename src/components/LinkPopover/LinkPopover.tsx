import type { FormEvent } from 'react';
import type { EditorSelection } from '../../editor-core/selection';

type LinkPopoverProps = {
  href: string;
  selection: EditorSelection;
  onHrefChange: (href: string) => void;
  onSubmit: (href: string, selection: EditorSelection) => void;
  onCancel: () => void;
};

/** Renders the URL form used to apply a link to the selected text. */
export default function LinkPopover({
  href,
  selection,
  onHrefChange,
  onSubmit,
  onCancel,
}: LinkPopoverProps) {
  /** Submits the entered URL for the current selection. */
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(href, selection);
  };

  return (
    <form className="link-popover" onSubmit={handleSubmit}>
      <label htmlFor="link-href">Link URL</label>
      <input
        id="link-href"
        type="url"
        value={href}
        placeholder="https://example.com"
        onChange={(event) => onHrefChange(event.target.value)}
        autoFocus
        required
      />
      <div className="link-actions">
        <button type="submit">Apply</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
