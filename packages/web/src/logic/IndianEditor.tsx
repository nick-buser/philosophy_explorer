import { LogicCmEditor } from './LogicCmEditor';
import { INDIAN_COMMANDS } from './indian-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function IndianEditor(props: Props) {
  return <LogicCmEditor {...props} commands={INDIAN_COMMANDS} />;
}
