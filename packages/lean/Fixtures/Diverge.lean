-- Timeout-path fixture: a non-terminating `#eval`. The runner must
-- enforce its hard timeout and kill this process tree. `partial def`
-- permits the non-terminating recursion; the tail call never overflows
-- the stack, so the process genuinely hangs rather than crashing.

partial def loop (n : Nat) : Nat := loop (n + 1)

#eval loop 0
