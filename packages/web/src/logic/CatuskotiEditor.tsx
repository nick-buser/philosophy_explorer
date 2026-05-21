import { LogicCmEditor } from './LogicCmEditor';
import { CATUSKOTI_COMMANDS } from './catuskoti-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function CatuskotiEditor(props: Props) {
  return <LogicCmEditor {...props} commands={CATUSKOTI_COMMANDS} />;
}
