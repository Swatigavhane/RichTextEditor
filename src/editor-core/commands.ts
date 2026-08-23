import type { Mark } from '../model/types';

export type ActiveMarkId = 'bold' | 'italic' | 'link';

export const EditorCommand = {
  TOGGLE_BOLD: 'TOGGLE_BOLD',
  TOGGLE_ITALIC: 'TOGGLE_ITALIC',
  SET_LINK: 'SET_LINK',
  REMOVE_LINK: 'REMOVE_LINK',
  UNDO: 'UNDO',
  REDO: 'REDO',
} as const;

export type EditorCommandId = (typeof EditorCommand)[keyof typeof EditorCommand];

export type ToolbarCommandConfig = {
  id: EditorCommandId;
  label: string;
  mark: Mark;
  activeMark: ActiveMarkId | null;
};

export const COMMON_MARKS = {
  bold: 'bold' as Mark,
  italic: 'italic' as Mark,
  link: {
    type: 'link',
    href: 'https://example.com',
  } as Mark,
} as const;

export const TOOLBAR_COMMANDS: ToolbarCommandConfig[] = [
  {
    id: EditorCommand.TOGGLE_BOLD,
    label: 'Bold',
    mark: COMMON_MARKS.bold,
    activeMark: 'bold',
  },
  {
    id: EditorCommand.TOGGLE_ITALIC,
    label: 'Italic',
    mark: COMMON_MARKS.italic,
    activeMark: 'italic',
  },
  {
    id: EditorCommand.SET_LINK,
    label: 'Link',
    mark: COMMON_MARKS.link,
    activeMark: 'link',
  },
];

const COMMAND_TO_MARK = new Map(
  TOOLBAR_COMMANDS.map((command) => [command.id, command.mark] as const),
);

export const resolveEditorCommandMark = (command: EditorCommandId): Mark | undefined =>
  COMMAND_TO_MARK.get(command);