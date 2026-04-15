/**
 * Shims for graphology packages under moduleResolution: NodeNext.
 *
 * graphology's package.json "exports" field doesn't include per-condition
 * "types" entries, so NodeNext can't pair the .mjs import with the .d.ts.
 * These declarations re-export the actual types under the correct paths.
 */

declare module 'graphology' {
  import { AbstractGraph, Attributes } from 'graphology-types';

  class Graph<
    NA extends Attributes = Attributes,
    EA extends Attributes = Attributes,
    GA extends Attributes = Attributes,
  > extends AbstractGraph<NA, EA, GA> {}

  export default Graph;
  export { Graph };
}

declare module 'graphology-shortest-path/unweighted.js' {
  import { AbstractGraph } from 'graphology-types';

  export function bidirectional(
    graph: AbstractGraph,
    source: string,
    target: string,
  ): string[] | null;
}
