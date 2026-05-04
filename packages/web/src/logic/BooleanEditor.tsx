import { LogicCmEditor } from './LogicCmEditor';
import { BOOLEAN_COMMANDS } from './boolean-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function BooleanEditor(props: Props) {
  return <LogicCmEditor {...props} commands={BOOLEAN_COMMANDS} />;
}