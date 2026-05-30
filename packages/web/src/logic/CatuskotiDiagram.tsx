import { FOUR_KOTIS } from './catuskoti-types';
import type { KotiNumber, TruthValue } from './catuskoti-types';
import type { Evaluation } from './catuskoti-engine';

// The four-corner catuṣkoṭi diagram — the proposition at the centre
// and the four koṭis at the corners of a square. A diagrammatic foil
// to the square of opposition: same four-cornered layout, but the
// corners are the *non-classical* extensions (the glut and the gap)
// alongside the two classical contradictories.
//
// The selected koṭi is ringed. Each corner carries its corner-
// formula's FDE value, evaluated under v(A). In the prasaṅga reading
// every corner is struck through — the Madhyamaka refusal of all four.

const WIDTH = 400;
const HEIGHT = 340;
const CARD_W = 164;
const CARD_H = 92;
const MARGIN = 14;

// koṭi number → top-left corner of its card.
const CARD_XY: Record<KotiNumber, { x: number; y: number }> = {
  1: { x: MARGIN, y: MARGIN },
  2: { x: WIDTH - MARGIN - CARD_W, y: MARGIN },
  3: { x: MARGIN, y: HEIGHT - MARGIN - CARD_H },
  4: { x: WIDTH - MARGIN - CARD_W, y: HEIGHT - MARGIN - CARD_H },
};

const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };

// The FDE value of a corner-formula, as a compact glyph.
function valueGlyph(values: readonly TruthValue[]): string {
  const t = values.includes('true');
  const f = values.includes('false');
  if (t && f) return 'T F';
  if (t) return 'T';
  if (f) return 'F';
  return '∅';
}

type Props = {
  evaluation: Evaluation | null;
  className?: string;
};

export function CatuskotiDiagram({ evaluation, className }: Props) {
  const cornerOf = (n: KotiNumber) => evaluation?.corners.find(c => c.koti.n === n) ?? null;
  const prasanga = evaluation?.reading === 'prasanga';

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width={WIDTH}
        height={HEIGHT}
        className="max-w-full"
        aria-label="The four corners of the catuṣkoṭi"
      >
        {/* spokes from the proposition to each corner */}
        {FOUR_KOTIS.map(k => {
          const { x, y } = CARD_XY[k.n];
          return (
            <line
              key={`spoke-${k.n}`}
              x1={CENTER.x}
              y1={CENTER.y}
              x2={x + CARD_W / 2}
              y2={y + CARD_H / 2}
              stroke="rgba(75, 85, 99, 0.4)"
              strokeWidth={1}
            />
          );
        })}

        {/* corner cards */}
        {FOUR_KOTIS.map(k => {
          const { x, y } = CARD_XY[k.n];
          const corner = cornerOf(k.n);
          const isActive = evaluation?.koti.n === k.n;
          const designated = corner?.designated ?? false;

          const borderColor = isActive
            ? '#fbbf24'
            : prasanga
              ? 'rgba(244, 63, 94, 0.4)'
              : 'rgba(75, 85, 99, 0.7)';
          const bgColor = isActive
            ? 'rgba(251, 191, 36, 0.12)'
            : 'rgba(15, 23, 42, 0.6)';

          return (
            <g key={k.n}>
              <title>{`Koṭi ${k.n}: ${k.sanskrit} — ${k.gloss}`}</title>
              <rect
                x={x}
                y={y}
                width={CARD_W}
                height={CARD_H}
                rx={8}
                fill={bgColor}
                stroke={borderColor}
                strokeWidth={isActive ? 2 : 1.2}
              />
              <text
                x={x + CARD_W / 2}
                y={y + 20}
                textAnchor="middle"
                className={isActive ? 'fill-amber-200 text-[10.5px]' : 'fill-gray-400 text-[10.5px]'}
              >
                Koṭi {k.n} · <tspan fontStyle="italic">{k.sanskrit}</tspan>
              </text>
              <text
                x={x + CARD_W / 2}
                y={y + 46}
                textAnchor="middle"
                className={
                  isActive
                    ? 'fill-amber-100 text-[15px] font-mono font-semibold'
                    : 'fill-gray-200 text-[15px] font-mono'
                }
              >
                {k.formula}
              </text>
              {corner ? (
                <text
                  x={x + CARD_W / 2}
                  y={y + 72}
                  textAnchor="middle"
                  className={
                    designated
                      ? 'fill-emerald-300 text-[10px] font-mono'
                      : 'fill-gray-500 text-[10px] font-mono'
                  }
                >
                  value {valueGlyph(corner.value)} · {designated ? 'assertible' : 'not assertible'}
                </text>
              ) : (
                <text
                  x={x + CARD_W / 2}
                  y={y + 72}
                  textAnchor="middle"
                  className="fill-gray-600 text-[10px]"
                >
                  {k.gloss}
                </text>
              )}
              {/* prasaṅga: every corner is refused */}
              {prasanga && (
                <line
                  x1={x + 10}
                  y1={y + CARD_H - 10}
                  x2={x + CARD_W - 10}
                  y2={y + 10}
                  stroke="rgba(244, 63, 94, 0.65)"
                  strokeWidth={1.6}
                />
              )}
            </g>
          );
        })}

        {/* the proposition at the centre */}
        <g>
          <rect
            x={CENTER.x - 76}
            y={CENTER.y - 27}
            width={152}
            height={54}
            rx={8}
            fill="rgba(2, 6, 23, 0.92)"
            stroke="rgba(96, 165, 250, 0.5)"
            strokeWidth={1.2}
          />
          <text
            x={CENTER.x}
            y={CENTER.y - 6}
            textAnchor="middle"
            className="fill-gray-500 text-[9px] uppercase tracking-wider"
          >
            proposition A
          </text>
          <text
            x={CENTER.x}
            y={CENTER.y + 13}
            textAnchor="middle"
            className="fill-blue-200 text-[11px]"
          >
            {evaluation
              ? evaluation.reading === 'prasanga'
                ? 'all four refused'
                : `koṭi ${evaluation.koti.n} affirmed`
              : 'enter a proposition'}
          </text>
        </g>
      </svg>

      <p className="text-xs text-gray-500 leading-relaxed">
        The four koṭis at the corners — the two classical contradictories{' '}
        <span className="font-mono text-gray-400">A</span> /{' '}
        <span className="font-mono text-gray-400">¬A</span>, plus the glut{' '}
        <span className="font-mono text-gray-400">A∧¬A</span> and the gap{' '}
        <span className="font-mono text-gray-400">¬(A∨¬A)</span> that classical logic
        excludes. Each corner shows its formula’s value under{' '}
        <span className="font-mono text-gray-400">v(A)</span>. In the prasaṅga reading
        every corner is struck — the Madhyamaka refusal of all four.
      </p>
    </div>
  );
}
