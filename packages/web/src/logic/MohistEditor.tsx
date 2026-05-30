import { LogicCmEditor } from './LogicCmEditor';
import { MOHIST_COMMANDS } from './mohist-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function MohistEditor(props: Props) {
  return <LogicCmEditor {...props} commands={MOHIST_COMMANDS} />;
}
