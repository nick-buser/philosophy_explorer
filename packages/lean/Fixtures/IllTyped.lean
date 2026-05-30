import Sanity

-- Failed-path fixture: `42 : Nat` cannot inhabit `True`. The type
-- mismatch gives the runner a line-located `--json` diagnostic to parse.
theorem ill_typed : True := 42
