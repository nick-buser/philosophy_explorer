// Existential-graph AST for the alpha system (propositional).
// Short-form DSL (Peirce's own convention, rendered in ASCII):
//   juxtaposition (space) ...... conjunction
//   parentheses "(...)" ........ cut (negation)
//   empty cut "()" ............. absurdity / false
//   implication "(A (B))" ...... Peirce's scroll: A implies B
//
// Beta (first-order) is future work; the AST leaves room for it via a
// future `Line` variant.

export type EgNode =
  | { kind: 'sheet'; children: EgNode[] }   // the top-level sheet of assertion
  | { kind: 'cut';   children: EgNode[] }   // a negation context
  | { kind: 'atom';  name: string };        // a propositional atom

export function isSheet(n: EgNode): n is Extract<EgNode, { kind: 'sheet' }> {
  return n.kind === 'sheet';
}