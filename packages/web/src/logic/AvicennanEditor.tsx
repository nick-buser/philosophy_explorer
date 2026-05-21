import { LogicCmEditor } from './LogicCmEditor';
import { AVICENNAN_COMMANDS } from './avicennan-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function AvicennanEditor(props: Props) {
  return <LogicCmEditor {...props} commands={AVICENNAN_COMMANDS} />;
}
