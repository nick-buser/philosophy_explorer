import { LogicCmEditor } from './LogicCmEditor';
import { SAPTABHANGI_COMMANDS } from './saptabhangi-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function SaptabhangiEditor(props: Props) {
  return <LogicCmEditor {...props} commands={SAPTABHANGI_COMMANDS} />;
}
