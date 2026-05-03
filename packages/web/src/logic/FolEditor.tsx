import { LogicCmEditor } from './LogicCmEditor';
import { FOL_COMMANDS } from './fol-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function FolEditor(props: Props) {
  return <LogicCmEditor {...props} commands={FOL_COMMANDS} />;
}
