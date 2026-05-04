import { LogicCmEditor } from './LogicCmEditor';
import { ND_COMMANDS } from './nd-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function NdEditor(props: Props) {
  return <LogicCmEditor {...props} commands={ND_COMMANDS} />;
}
