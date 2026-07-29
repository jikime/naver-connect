<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## People matching read-first

Before changing onboarding, profiles, authentication/data-source behavior,
matching, recommendations, embeddings, vocabulary, or Supabase schemas, read:

- `docs/decisions/2026-07-29-people-matching-read-first.md`
- `docs/decisions/2026-07-29-reference-index.md`

These documents define the current people-to-people product goal, demo/pilot
boundary, privacy gates, embedding-space separation, vocabulary history, and
the review/merge boundary for the M0/M1 worktree. Do not silently replace these
decisions with a one-person-one-vector design, a JSON/DB fallback, or a
document-node relationship graph.
