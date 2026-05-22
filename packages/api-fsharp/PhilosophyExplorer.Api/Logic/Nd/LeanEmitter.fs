namespace PhilosophyExplorer.Logic.Nd

open System.Text

// FitchProof → Lean source for the NaturalDeduction embedding (Milestone 1).
//
// A structural fold: every FitchLine becomes one `let l<n> : Deriv rs Γ φ`
// binding, and the proof term is the binding of the conclusion line. The
// per-line explicit Deriv type is load-bearing — it keeps every context
// concrete so `by decide` can discharge the `∈` premise/assumption lookups
// and the `Deriv.reit` lifts resolve their implicit prepended formula. A
// single nested term instead leaves elimination-rule indices as
// metavariables `decide` cannot read (see NaturalDeduction/Examples.lean).
//
// Context model: a line at subproof depth d has context
// [innermost assumption, …, outermost assumption] ++ Γ0, where Γ0 is the
// proof's premises. A citation of a line in an enclosing scope is lifted
// with `Deriv.reit`, once per crossed subproof boundary; the unifier reads
// the prepended formula off the explicit `let` type.
//
// Emitted layout (load-bearing for the /api/verify diagnostic mapping):
// file line 1 = import, 2 = blank, 3 = `example`, line 3+j = Fitch line j.

module LeanEmitter =

    let private ruleSetToLean (rs: RuleSet) : string =
        match rs with
        | RuleSet.Classical -> "RuleSet.classical"
        | _ -> "RuleSet.intuitionistic"

    /// Render a formula as an NDFormula term. Sub-formulas are fully
    /// parenthesised, so the result is safe in any argument position.
    let rec formulaToLean (f: FolFormula) : string =
        match f with
        | Top -> "NDFormula.top"
        | Bot -> "NDFormula.bot"
        | Pred name ->
            let escaped = name.Replace("\\", "\\\\").Replace("\"", "\\\"")
            sprintf "NDFormula.atom \"%s\"" escaped
        | Not body -> sprintf "NDFormula.neg (%s)" (formulaToLean body)
        | And(l, r) -> sprintf "NDFormula.and (%s) (%s)" (formulaToLean l) (formulaToLean r)
        | Or(l, r) -> sprintf "NDFormula.or (%s) (%s)" (formulaToLean l) (formulaToLean r)
        | Implies(l, r) -> sprintf "NDFormula.imp (%s) (%s)" (formulaToLean l) (formulaToLean r)
        | Iff(l, r) -> sprintf "NDFormula.iff (%s) (%s)" (formulaToLean l) (formulaToLean r)

    let private contextToLean (ctx: FolFormula list) : string =
        ctx |> List.map formulaToLean |> String.concat ", " |> sprintf "[%s]"

    /// Emit a complete .lean file asserting that `proof` inhabits
    /// `Deriv rs Γ0 conclusion` — the Lean kernel checking the term is the
    /// verification. Assumes a well-formed proof (the /api/verify route
    /// validates structure first).
    let emit (rs: RuleSet) (proof: FitchProof) : string =
        let rsLean = ruleSetToLean rs
        let lines = proof.Lines |> List.sortBy (fun l -> l.LineNo)

        // Γ0 — the premises (depth-0 `premise`-rule lines), in line order.
        let gamma0 =
            lines
            |> List.filter (fun l -> l.Depth = 0 && l.Rule = Rule.Premise)
            |> List.map (fun l -> l.Formula)

        let depthOf = lines |> List.map (fun l -> l.LineNo, l.Depth) |> Map.ofList

        // Context of each line: fold the ordered lines, threading the stack
        // of open assumptions (innermost-first). An `assumption` line opens
        // its depth; any other line sits at a depth its enclosing scopes
        // already established.
        let keepLast k (xs: FolFormula list) =
            let n = List.length xs
            if n > k then List.skip (n - k) xs else xs

        let contexts =
            lines
            |> List.fold
                (fun (stack: FolFormula list, acc) l ->
                    let lineStack =
                        if l.Rule = Rule.Assumption then
                            l.Formula :: keepLast (l.Depth - 1) stack
                        else
                            keepLast l.Depth stack
                    (lineStack, (l.LineNo, lineStack @ gamma0) :: acc))
                ([], [])
            |> snd
            |> Map.ofList

        // A reference to line `citedNo` from a citing line at `citingDepth`,
        // lifted across (citingDepth − citedDepth) enclosing subproofs.
        let refLine (citingDepth: int) (citedNo: int) : string =
            let k = citingDepth - depthOf.[citedNo]
            if k <= 0 then
                sprintf "l%d" citedNo
            else
                let mutable t = sprintf "l%d" citedNo
                for _ in 1..k do
                    t <- sprintf "Deriv.reit (%s)" t
                sprintf "(%s)" t

        // The constructor application for one line. Single-line citations
        // are lifted to the line's own depth; subproof ranges hand their
        // last line to the discharging constructor raw (it is already typed
        // in the extended context).
        let rhsOf (l: FitchLine) : string =
            let ref1 = refLine l.Depth
            match l.Rule, l.Cites with
            | Rule.Premise, _ -> "Deriv.premise (by decide)"
            | Rule.Assumption, _ -> "Deriv.premise (by decide)"
            | Rule.Reit, [ CiteLine n ] -> ref1 n
            | Rule.AndEL, [ CiteLine n ] -> sprintf "Deriv.andEL %s" (ref1 n)
            | Rule.AndER, [ CiteLine n ] -> sprintf "Deriv.andER %s" (ref1 n)
            | Rule.OrIL, [ CiteLine n ] -> sprintf "Deriv.orIL %s" (ref1 n)
            | Rule.OrIR, [ CiteLine n ] -> sprintf "Deriv.orIR %s" (ref1 n)
            | Rule.BotE, [ CiteLine n ] -> sprintf "Deriv.botE %s" (ref1 n)
            | Rule.AndI, [ CiteLine a; CiteLine b ] -> sprintf "Deriv.andI %s %s" (ref1 a) (ref1 b)
            | Rule.ImpE, [ CiteLine i; CiteLine a ] -> sprintf "Deriv.impE %s %s" (ref1 i) (ref1 a)
            | Rule.IffEL, [ CiteLine i; CiteLine a ] -> sprintf "Deriv.iffEL %s %s" (ref1 i) (ref1 a)
            | Rule.IffER, [ CiteLine i; CiteLine a ] -> sprintf "Deriv.iffER %s %s" (ref1 i) (ref1 a)
            // The prover cites notE as [positive, negation]; Deriv.notE takes
            // the negation first.
            | Rule.NotE, [ CiteLine pos; CiteLine neg ] -> sprintf "Deriv.notE %s %s" (ref1 neg) (ref1 pos)
            | Rule.ImpI, [ CiteRange(_, e) ] -> sprintf "Deriv.impI l%d" e
            | Rule.NotI, [ CiteRange(_, e) ] -> sprintf "Deriv.notI l%d" e
            // `rfl` proves `rs = RuleSet.classical`; under intuitionistic it
            // fails at the kernel, which is the correct verdict.
            | Rule.Raa, [ CiteRange(_, e) ] -> sprintf "Deriv.raa l%d rfl" e
            | Rule.IffI, [ CiteRange(_, e1); CiteRange(_, e2) ] -> sprintf "Deriv.iffI l%d l%d" e1 e2
            | Rule.OrE, [ CiteLine disj; CiteRange(_, e1); CiteRange(_, e2) ] ->
                sprintf "Deriv.orE %s l%d l%d" (ref1 disj) e1 e2
            | _ ->
                failwithf "LeanEmitter: line %d — rule %A with unexpected citations %A"
                    l.LineNo l.Rule l.Cites

        let conclusion = lines |> List.find (fun l -> l.LineNo = proof.ConclusionLine)

        let sb = StringBuilder()
        sb.AppendLine("import NaturalDeduction") |> ignore
        sb.AppendLine() |> ignore
        sb.AppendLine(
            sprintf "example : Deriv %s %s (%s) :="
                rsLean (contextToLean gamma0) (formulaToLean conclusion.Formula))
        |> ignore
        for l in lines do
            sb.AppendLine(
                sprintf "  let l%d : Deriv %s %s (%s) := %s"
                    l.LineNo rsLean (contextToLean contexts.[l.LineNo])
                    (formulaToLean l.Formula) (rhsOf l))
            |> ignore
        sb.AppendLine(sprintf "  l%d" proof.ConclusionLine) |> ignore
        sb.ToString()
