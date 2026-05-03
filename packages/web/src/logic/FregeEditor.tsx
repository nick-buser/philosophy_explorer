import { LogicCmEditor } from './LogicCmEditor';
import { FREGE_COMMANDS } from './frege-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function FregeEditor(props: Props) {
  return <LogicCmEditor {...props} commands={FREGE_COMMANDS} />;
}