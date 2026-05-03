import { LogicCmEditor } from './LogicCmEditor';
import { EG_COMMANDS } from './eg-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function EgEditor(props: Props) {
  return <LogicCmEditor {...props} commands={EG_COMMANDS} />;
}