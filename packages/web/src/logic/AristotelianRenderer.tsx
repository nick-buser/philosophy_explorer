import { useId, useMemo } from 'react';
import type { AristotelianFormula } from './aristotelian-types';
import {
  LAYOUT,
  layoutProposition,
  layoutSyllogism,
  type Layout,
  type RenderedCircle,
  type ShadedRegion,
} from './aristotelian-layout';

// SVG renderer for Aristotelian Venn diagrams.
//
// Shading is implemented with SVG masks: the white parts of a mask are
// where the fill is visible. For region "inside X, outside Y, outside Z"
// we start the mask with a white circle for X and paint black circles
// for the excluded ones. This avoids computing analytic region paths
// from arc intersections.

const STROKE_COLOR = '#e5e7eb';
const STROKE_WIDTH = 1.6;
const SHADE_FILL   = '#fde68a';      // pale gold matches the Frege quant glyph
const SHADE_OPAC   = 0.32;
const CROSS_COLOR  = '#fbbf24';      // amber for ×
const LABEL_COLOR  = '#f3f4f6';

type Props = {
  formula: AristotelianFormula;
  className?: string;
};

export function AristotelianRenderer({ formula, className }: Props) {
  const layout = useMemo<Layout>(
    () => formula.kind === 'proposition'
      ? layoutProposition(formula.proposition)
      : layoutSyllogism(formula.syllogism),
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

      {/* Shaded regions */}
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

      {/* Circles */}
      {layout.circles.map(c => (
        <circle
          key={c.role}
          cx={c.cx} cy={c.cy} r={c.r}
          fill="none"
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
        />
      ))}

      {/* × marks */}
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

      {/* Circle labels */}
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

function RegionMask({
  id, region, circles, width, height,
}: {
  id: string;
  region: ShadedRegion;
  circles: RenderedCircle[];
  width: number;
  height: number;
}) {
  // White = visible. Start by painting black everywhere, then white
  // inside each "inside" circle (intersected via mix-blend isn't
  // available in SVG masks — instead we paint white for the FIRST
  // included circle and rely on subsequent black-paints to subtract
  // for non-included ones). For the multi-circle "inside" case we use
  // luminance-mode masks: each black circle subtracts from the visible
  // area, each white circle adds.
  //
  // Actual technique: visible = (inside C1) ∩ (inside C2) ∩ ... ∩ (outside Other).
  // We start with the FIRST inside circle as the base white area, then
  // for each additional inside circle we mask further by drawing a
  // white "and" — but SVG masks compose by multiplication of luminance,
  // so a black-bg + white circle = visible only inside that circle.
  //
  // For an intersection of circles we need a *clip* not a mask. The
  // clean way: nested masks via `mask` attribute on the inner mask
  // element. SVG supports this.
  //
  // Implementation chosen: build the mask with the inside circles as
  // intersected (AND) regions and the outside circles as subtracted
  // areas. AND of multiple regions in SVG mask: chain via opacity.
  // Simpler and more robust: use a `<filter>` pipeline... overkill.
  //
  // Final pragmatic technique: a region's visible area is the
  // intersection of N circles minus M circles. Express as an SVG
  // <mask> where:
  //   - First "inside" circle = white  (luminance 1)
  //   - Each additional inside circle = white painted with a mask
  //     that's white inside the *previous* intersection only
  //   - Each "outside" circle = black on top
  // To avoid building recursively, observe that for our 7 regions in a
  // 3-circle Venn the inside-set has at most 3 elements. We special-case
  // by length.
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
        // Visible = C1 ∩ C2: paint a white C1 then a white C2 with a mask
        // that restricts it to inside C1.
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

// Helper: paint a white area equal to the intersection of two circles.
function IntersectTwo({
  a, b, maskId, width, height,
}: {
  a: RenderedCircle;
  b: RenderedCircle;
  maskId: string;
  width: number;
  height: number;
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

// Helper: paint a white area equal to the intersection of three circles.
function IntersectThree({
  a, b, c, maskId, width, height,
}: {
  a: RenderedCircle;
  b: RenderedCircle;
  c: RenderedCircle;
  maskId: string;
  width: number;
  height: number;
}) {
  // Build a nested mask that's "white inside (A ∩ B)", then paint a
  // white circle for C using that as its mask. Result: white inside
  // (A ∩ B ∩ C).
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

