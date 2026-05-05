import KripkeLab from './KripkeLab';
import type { LogicSystem } from '../../data/logic-systems';
import { DEONTIC_COMMANDS, findDeonticCommand } from '../deontic-commands';

// Standard deontic logic (KD) is the same engine as the Kripke modal lab,
// re-glossed: □φ as Oφ ("obligatory"), ◇φ as Pφ ("permitted"), and the
// frame is serial. We reuse KripkeLab and inject deontic commands; the
// system entry's examples drive the example dropdown.

export default function DeonticLab({ system }: { system: LogicSystem }) {
  return (
    <KripkeLab
      system={system}
      commands={DEONTIC_COMMANDS}
      findCommand={findDeonticCommand}
    />
  );
}
