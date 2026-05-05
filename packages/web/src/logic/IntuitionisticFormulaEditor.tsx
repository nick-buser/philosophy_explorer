import { LogicCmEditor } from './LogicCmEditor';
import { INTUITIONISTIC_COMMANDS } from './intuitionistic-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function IntuitionisticFormulaEditor(props: Props) {
  return <LogicCmEditor {...props} commands={INTUITIONISTIC_COMMANDS} />;
}
