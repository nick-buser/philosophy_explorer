-- Connectivity-spike fixture: the trivially-true theorem that the
-- `/api/lean/health` route and the LeanRunner integration tests verify
-- end-to-end. The only module `lake build` compiles, so a passing build
-- produces the `.olean` that scratch jobs `import`.
-- No embedding yet — see docs/formal-logic/formal-verification.md §5.

theorem ok : True := trivial
