import { LogicCmEditor } from './LogicCmEditor';
import { MEDIEVAL_COMMANDS } from './medieval-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function MedievalEditor(props: Props) {
  return <LogicCmEditor {...props} commands={MEDIEVAL_COMMANDS} />;
}
