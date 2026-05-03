import { LogicCmEditor } from './LogicCmEditor';
import { KRIPKE_COMMANDS } from './kripke-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function KripkeFormulaEditor(props: Props) {
  return <LogicCmEditor {...props} commands={KRIPKE_COMMANDS} />;
}