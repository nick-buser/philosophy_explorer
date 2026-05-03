import { useId, useMemo } from 'react';
import type { MedievalFormula } from './medieval-types';
import {
  LAYOUT,
  type RenderedCircle,
  type ShadedRegion,
} from './aristotelian-layout';
import {
  SORITES_LAYOUT,
  layoutModalProposition,
  layoutModalSyllogism,
  layoutSorites,
  type ModalGlyph,
  type ModalPropositionLayout,
  type ModalSyllogismLayout,
  type SoritesLayout,
} from './medieval-layout';

// SVG renderer for medieval syllogistic. Three top-level shapes:
//   - modal proposition  → 2-circle Venn + a single modal glyph
//   - modal syllogism    → 3-circle Venn + per-premise modal glyphs
//   - sorites chain      → linear term-node + step-edge diagram
//
// The shading + ×-mark rendering is a copy of the Aristotelian
// renderer's mask technique. It would be reasonable to factor the
// Venn renderer into a shared component (the next REFAC after this
// ticket) but the bodies are short enough that duplicating is the
// cheaper move for one ticket.

const STROKE_COLOR = '#e5e7eb';
const STROKE_WIDTH = 1.6;
const SHADE_FILL   = '#fde68a';
const SHADE_OPAC   = 0.32;
const CROSS_COLOR  = '#fbbf24';
const LABEL_COLOR  = '#f3f4f6';
const GLYPH_COLOR  = '#a78bfa';      // violet to differentiate from shading/×
const GLYPH_FONT_PX = 18;
const NODE_FILL = '#0f172a';
const NODE_STROKE = '#475569';
const NODE_TEXT = '#f3f4f6';
const EDGE_COLOR = '#64748b';
const EDGE_FAIL_COLOR = '#f87171';
const STEP_LABEL_COLOR = '#94a3b8';

type Props = {
  formula: MedievalFormula;
  className?: string;
  // Sorites validity overlay — when the syllogism is a sorites and we
  // have its check result, the renderer paints the failed edge red.
  failedStepIndex?: number | null;
  stepNames?: string[];
};

export function MedievalRenderer({
  formula, className, failedStepIndex = null, stepNames = [],
}: Props) {
  if (formula.kind === 'sorites') {
    const layout = layoutSorites(formula.chain, stepNames, failedStepIndex);
    return (
      <SoritesSvg
        layout={layout}
        className={className}
      />
    );
  }
  return <VennSvg formula={formula} className={className} />;
}

// ─────────────────────────────────────────────────────────────────────
// Modal Venn (proposition or syllogism)

function VennSvg({
  formula, className,
}: {
  formula: Extract<MedievalFormula, { kind: 'modal-proposition' | 'modal-syllogism' }>;
  className?: string;
}) {
  const layout = useMemo<ModalPropositionLayout | ModalSyllogismLayout>(
    () => formula.kind === 'modal-proposition'
      ? layoutModalProposition(formula.proposition)
      : layoutModalSyllogism(formula.syllogism),
    [formula],
  );
  const idPrefix = useId().replace(/[:]/g, '_');

  return (
    <svg
      className={className}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      <defs>
        {layout.shaded.map((region, i) => (
          <RegionMask
            key={i}
            id={`${idPrefix}-mask-${i}`}
            region={region}
            circles={layout.circles}
            width={layout.width}
            height={layout.height}
          />
        ))}
      </defs>

      {layout.shaded.map((_, i) => (
        <rect
          key={`shade-${i}`}
          x={0} y={0}
          width={layout.width} height={layout.height}
          fill={SHADE_FILL}
          fillOpacity={SHADE_OPAC}
          mask={`url(#${idPrefix}-mask-${i})`}
        />
      ))}

      {layout.circles.map(c => (
        <circle
          key={c.role}
          cx={c.cx} cy={c.cy} r={c.r}
          fill="none"
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
        />
      ))}

      {layout.crosses.map((m, i) => (
        <text
          key={`cross-${i}`}
          x={m.cx}
          y={m.cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="bold"
          fontSize={LAYOUT.CROSS_FONT_PX}
          fill={CROSS_COLOR}
        >
          ×
        </text>
      ))}

      {layout.glyphs.map((g, i) => (
        <ModalGlyphMark key={`glyph-${i}`} glyph={g} />
      ))}

      {layout.circles.map(c => (
        <text
          key={`label-${c.role}`}
          x={c.labelX}
          y={c.labelY}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontStyle="italic"
          fontSize={LAYOUT.LABEL_FONT_PX}
          fill={LABEL_COLOR}
        >
          {c.role}
        </text>
      ))}
    </svg>
  );
}

function ModalGlyphMark({ glyph }: { glyph: ModalGlyph }) {
  return (
    <text
      x={glyph.cx}
      y={glyph.cy}
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily="'JetBrains Mono', 'IBM Plex Mono', monospace"
      fontWeight="600"
      fontSize={GLYPH_FONT_PX}
      fill={GLYPH_COLOR}
    >
      {glyph.symbol}
    </text>
  );
}

function RegionMask({
  id, region, circles, width, height,
}: {
  id: string;
  region: ShadedRegion;
  circles: RenderedCircle[];
  width: number;
  height: number;
}) {
  const insideCircles = region.inside
    .map(role => circles.find(c => c.role === role)!)
    .filter(Boolean);
  const outsideCircles = circles.filter(c => !region.inside.includes(c.role));

  return (
    <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
      <rect x={0} y={0} width={width} height={height} fill="black" />
      {insideCircles.length === 1 && (
        <circle cx={insideCircles[0]!.cx} cy={insideCircles[0]!.cy} r={insideCircles[0]!.r} fill="white" />
      )}
      {insideCircles.length === 2 && (
        <IntersectTwo a={insideCircles[0]!} b={insideCircles[1]!} maskId={`${id}-i2`} width={width} height={height} />
      )}
      {insideCircles.length === 3 && (
        <IntersectThree a={insideCircles[0]!} b={insideCircles[1]!} c={insideCircles[2]!} maskId={`${id}-i3`} width={width} height={height} />
      )}
      {outsideCircles.map(c => (
        <circle key={`o-${c.role}`} cx={c.cx} cy={c.cy} r={c.r} fill="black" />
      ))}
    </mask>
  );
}

function IntersectTwo({
  a, b, maskId, width, height,
}: {
  a: RenderedCircle; b: RenderedCircle; maskId: string; width: number; height: number;
}) {
  return (
    <>
      <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} fill="black" />
        <circle cx={a.cx} cy={a.cy} r={a.r} fill="white" />
      </mask>
      <circle cx={b.cx} cy={b.cy} r={b.r} fill="white" mask={`url(#${maskId})`} />
    </>
  );
}

function IntersectThree({
  a, b, c, maskId, width, height,
}: {
  a: RenderedCircle; b: RenderedCircle; c: RenderedCircle; maskId: string; width: number; height: number;
}) {
  return (
    <>
      <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} fill="black" />
        <IntersectTwo a={a} b={b} maskId={`${maskId}-ab`} width={width} height={height} />
      </mask>
      <circle cx={c.cx} cy={c.cy} r={c.r} fill="white" mask={`url(#${maskId})`} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sorites chain

function SoritesSvg({ layout, className }: { layout: SoritesLayout; className?: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      {/* Edges first so the nodes draw over the arrowhead joints. */}
      {layout.edges.map((e, i) => {
        const from = layout.nodes[e.from]!;
        const to = layout.nodes[e.to]!;
        const x1 = from.x + from.w;
        const y1 = from.y + from.h / 2;
        const x2 = to.x;
        const y2 = to.y + to.h / 2;
        const colour = e.failed ? EDGE_FAIL_COLOR : EDGE_COLOR;
        return (
          <g key={`edge-${i}`}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={colour}
              strokeWidth={1.4}
              markerEnd={`url(#sorites-arrow-${e.failed ? 'fail' : 'ok'})`}
            />
            <text
              x={e.midX}
              y={e.midY - 6}
              textAnchor="middle"
              fontSize={SORITES_LAYOUT.STEP_LABEL_FONT}
              fill={STEP_LABEL_COLOR}
              fontFamily="'JetBrains Mono', 'IBM Plex Mono', monospace"
            >
              {e.label}
            </text>
          </g>
        );
      })}

      {/* Term nodes */}
      {layout.nodes.map(n => (
        <g key={`node-${n.index}`}>
          <rect
            x={n.x} y={n.y} width={n.w} height={n.h} rx={6}
            fill={NODE_FILL}
            stroke={NODE_STROKE}
            strokeWidth={1.2}
          />
          <text
            x={n.x + n.w / 2}
            y={n.y + n.h / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontStyle="italic"
            fontSize={SORITES_LAYOUT.TERM_LABEL_FONT}
            fill={NODE_TEXT}
          >
            {n.term}
          </text>
        </g>
      ))}

      <defs>
        <marker
          id="sorites-arrow-ok"
          markerWidth={8} markerHeight={8}
          refX={7} refY={4}
          orient="auto-start-reverse"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill={EDGE_COLOR} />
        </marker>
        <marker
          id="sorites-arrow-fail"
          markerWidth={8} markerHeight={8}
          refX={7} refY={4}
          orient="auto-start-reverse"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill={EDGE_FAIL_COLOR} />
        </marker>
      </defs>
    </svg>
  );
}
