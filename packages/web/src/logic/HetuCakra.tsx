import type { Cell, CellId, SapakshaCount, VipakshaCount } from './indian-types';
import { HETU_CAKRA } from './indian-types';

// Dignāga's hetu-cakra rendered as a 3×3 grid. Rows are sapakṣa
// presence (all / some / none), columns are vipakṣa presence in
// the same order. The active cell — the one the current inference
// places the hetu in — is highlighted; every cell's status
// (valid / inconclusive / contradictory) is colour-coded.

type Props = {
  activeCell?: CellId;
  className?: string;
};

const SAP_ROWS: SapakshaCount[] = ['all', 'some', 'none'];
const VIP_COLS: VipakshaCount[] = ['all', 'some', 'none'];

const SAP_LABEL: Record<SapakshaCount, string> = {
  all:  'sapakṣa: all',
  some: 'sapakṣa: some',
  none: 'sapakṣa: none',
};
const VIP_LABEL: Record<VipakshaCount, string> = {
  all:  'vipakṣa: all',
  some: 'vipakṣa: some',
  none: 'vipakṣa: none',
};

export function HetuCakra({ activeCell, className }: Props) {
  return (
    <div className={'w-full overflow-x-auto ' + (className ?? '')}>
      <div className="grid gap-px bg-gray-800 rounded overflow-hidden text-xs"
           style={{ gridTemplateColumns: 'auto repeat(3, minmax(0, 1fr))' }}>
        <div className="bg-gray-950 px-2 py-2 text-gray-600 text-[10px] tracking-wider uppercase">
          hetu in →
        </div>
        {VIP_COLS.map(v => (
          <div key={v} className="bg-gray-950 px-2 py-2 text-gray-400 text-[10px] tracking-wider uppercase">
            {VIP_LABEL[v]}
          </div>
        ))}

        {SAP_ROWS.map(s => (
          <RowCells key={s} sap={s} activeCell={activeCell} />
        ))}
      </div>
    </div>
  );
}

function RowCells({ sap, activeCell }: { sap: SapakshaCount; activeCell?: CellId }) {
  const row: Cell[] = HETU_CAKRA.filter(c => c.sapaksha === sap);
  return (
    <>
      <div className="bg-gray-950 px-2 py-3 text-gray-400 text-[10px] tracking-wider uppercase whitespace-nowrap">
        {SAP_LABEL[sap]}
      </div>
      {row.map(c => (
        <CellBox key={c.id} cell={c} active={c.id === activeCell} />
      ))}
    </>
  );
}

function CellBox({ cell, active }: { cell: Cell; active: boolean }) {
  const tone =
    cell.status === 'valid'
      ? 'bg-emerald-500/10 text-emerald-200'
      : cell.status === 'contradictory'
      ? 'bg-rose-500/10 text-rose-200'
      : 'bg-amber-500/10 text-amber-200';
  const ring = active ? 'ring-2 ring-blue-400 ring-inset' : '';
  return (
    <div
      className={`${tone} ${ring} px-2 py-3 leading-snug`}
      title={cell.gloss}
    >
      <div className="font-medium text-[11px]">{cell.sanskrit}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider opacity-70">{cell.status}</div>
    </div>
  );
}
