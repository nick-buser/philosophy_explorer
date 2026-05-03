import { LogicCmEditor } from './LogicCmEditor';
import { ARISTOTELIAN_COMMANDS } from './aristotelian-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function AristotelianEditor(props: Props) {
  return <LogicCmEditor {...props} commands={ARISTOTELIAN_COMMANDS} />;
}
