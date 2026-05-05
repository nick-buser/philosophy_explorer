import { LogicCmEditor } from './LogicCmEditor';
import { RESOLUTION_COMMANDS } from './resolution-commands';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function ResolutionEditor(props: Props) {
  return <LogicCmEditor {...props} commands={RESOLUTION_COMMANDS} />;
}
