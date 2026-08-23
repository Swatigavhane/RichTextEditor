import { useState } from 'react';
import { EditorCommand } from '../../editor-core/commands';
import type { ActiveMarkId, EditorCommandId } from '../../editor-core/commands';
import type { EditorSelection } from '../../editor-core/selection';
import EditorButton from '../EditorButton/EditorButton';
import LinkPopover from '../LinkPopover/LinkPopover';

type ToolbarButton = {
  command: EditorCommandId;
  label: string;
  icon: string;
  mark: ActiveMarkId | null;
};

const formattingButtons: ToolbarButton[] = [
  { command: EditorCommand.TOGGLE_BOLD, label: 'Bold', icon: 'B', mark: 'bold' },
  { command: EditorCommand.TOGGLE_ITALIC, label: 'Italic', icon: 'I', mark: 'italic' },
  { command: EditorCommand.SET_LINK, label: 'Link', icon: 'Link', mark: 'link' },
];

const historyButtons: ToolbarButton[] = [
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
type ToolbarProps = {
  activeMarks: ActiveMarkId[];
  runCommand: (command: EditorCommandId) => void;
  applyLink: (href: string, selection: EditorSelection) => void;
  selection: EditorSelection;
  canUndo: boolean;
  canRedo: boolean;
};

/** Renders formatting and history commands for the editor. */
export default function Toolbar({
  activeMarks,
  runCommand,
  applyLink,
  selection,
  canUndo,
  canRedo,
}: ToolbarProps) {
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkHref, setLinkHref] = useState('');

  /** Opens the link form while preserving the current editor selection. */
  const openLinkForm = () => {
    setIsLinkOpen(true);
    setLinkHref('');
  };

  /** Applies the entered URL and closes the link form. */
  const submitLink = (href: string, nextSelection: typeof selection) => {
    applyLink(href, nextSelection);
    setIsLinkOpen(false);
  };

  return (
    <div className="editor-toolbar">
      <div className="toolbar-group" role="group" aria-label="Text formatting">
        {formattingButtons.map(({ command, label, icon, mark }) => (
          <EditorButton
            key={command}
            buttonId={command === EditorCommand.TOGGLE_BOLD ? 'editor-bold-button' : undefined}
            disabled={isCommandDisabled(command, canUndo, canRedo)}
            icon={icon}
            iconClassName={`toolbar-icon-${command.toLowerCase()}`}
            isActive={Boolean(mark && activeMarks.includes(mark))}
            label={label}
            onClick={
              command === EditorCommand.SET_LINK
                ? activeMarks.includes('link')
                  ? () => runCommand(EditorCommand.REMOVE_LINK)
                  : openLinkForm
                : () => runCommand(command)
            }
          />
        ))}
        {isLinkOpen && (
          <LinkPopover
            href={linkHref}
            selection={selection}
            onHrefChange={setLinkHref}
            onSubmit={submitLink}
            onCancel={() => setIsLinkOpen(false)}
          />
        )}
      </div>
      <span className="toolbar-divider" aria-hidden="true" />
      <div className="toolbar-group toolbar-history" role="group" aria-label="History">
        {historyButtons.map(({ command, label, icon }) => (
          <EditorButton
            key={command}
            disabled={isCommandDisabled(command, canUndo, canRedo)}
            icon={icon}
            iconClassName={`toolbar-icon-${command.toLowerCase()}`}
            label={label}
            onClick={() => runCommand(command)}
          />
        ))}
      </div>
    </div>
  );
}
