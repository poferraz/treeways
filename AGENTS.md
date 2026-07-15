# AGENTS.md — urban-canopy-engine

Project-specific agent instructions. This file overrides the global `~/.claude/CLAUDE.md` for this repository only (global §14).

## Commit discipline at gate boundaries

This project ships through milestone exit gates (`docs/plans/2026-07-11-new-prd-implementation.md`, `docs/release-gates/`). Approved work piles up uncommitted when a satisfied gate does not produce a commit — that is work at risk, and it is how 48 files of gate-certified code ended up dirty in the working tree with `master` unpushed.

Prevent it:

- **Commit at every gate exit.** When a milestone's exit gate is satisfied, immediately commit the gated workset as one coherent commit (or a short sequence of coherent commits). Do not carry gate-certified work forward as uncommitted changes into the next milestone.
- **Push to `origin` before ending the session.** `master` must not end a session more than one commit ahead of `origin/master`.
- **Treat the Stop hook as a signal, not noise.** `.claude/settings.json` runs a Stop hook that warns when the working tree has more than 15 uncommitted files at turn end. When it fires on gate-certified work, commit. Active in-progress implementation may legitimately exceed the threshold; the number exists to tell the two apart.

This rule is the user's standing approval to commit at each satisfied exit gate and to push at session end. It does not license commits outside those boundaries — there, the global "commit or push only when the user asks" rule still applies.