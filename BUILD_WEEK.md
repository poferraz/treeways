# Treeways — OpenAI Build Week record

This file distinguishes the pre-existing Urban Canopy Engine from work created
during OpenAI Build Week. It is a factual engineering ledger, not marketing
copy.

## Submission window

- Event: OpenAI Build Week
- Submission period: July 13, 2026 at 9:00 AM PT through July 21, 2026 at
  5:00 PM PT
- Entrant: Paulo Ferraz, individual, Canada
- Track: Apps for Your Life

## Ownership and source material

Paulo Ferraz is the sole author and owner of the project code. The project uses
public City of Vancouver tree data under the terms recorded in
`docs/data-provenance.md` and each city pack's data licence file. No employer or
client owns the submission.

## Pre-existing baseline

The last commit before the submission period is:

`796fcb91a898a55a826f976c349915b307d14179`

That baseline already contained the map-first Vancouver field guide, municipal
and curated tree browsing, search, filters, tree details, custom route building,
responsive map/inspector layouts, accessibility foundations, service-worker
support, and automated verification.

The original repository remains at
<https://github.com/poferraz/urban-canopy-engine>. Treeways preserves its full
history but develops the Build Week submission independently at
<https://github.com/poferraz/treeways>.

## Work created during Build Week

### July 15 foundation

- `9b92cea`: repository commit-discipline guardrails
- `f73589c`: reproducible full-city artifact pipeline, source evidence
  foundations, giant-tree classification, trail candidate generation,
  deterministic-build verification, and expanded tests

### Treeways extension

The new repository will add the reviewed, consumer-facing product layer:

- neighbourhood-first curated trails
- exact-species, similar-appearance, typical bloom, fruit-viewing, measured
  height, and measured diameter themes
- small (up to 3 km), medium (up to 5 km), and large (up to 8 km) trail sizes
- walking and driving handoffs
- seasonal first-run guidance
- a human-reviewed trail catalogue compiled into the city artifact
- public Vercel deployment and complete judge documentation

Commits will be added to this ledger at every completed release gate.

## Human decisions

Generated trail candidates are proposals only. Paulo reviews and approves every
published trail's name, description, ordered membership, travel mode, and
limitations. AI output is never represented as human review, live seasonal
observation, harvesting permission, pedestrian-safety inspection, or
accessibility verification.

## AI collaboration

Models used across the project include GLM 5.2, Kimi 2.7, GPT-5.6, and Mistral
3. The Build Week implementation is being completed primarily in one Codex task
using GPT-5.6 Sol at high reasoning effort.

The final README and submission will identify where Codex accelerated work,
where GPT-5.6 was used, and which product, data, safety, design, and release
decisions remained human decisions. The `/feedback` session ID for the primary
implementation task will be added before submission.

## Required submission evidence

- public working deployment
- public repository with relevant licence and reproducible setup
- README with setup, sample/public data, limitations, and Codex/GPT-5.6 use
- Build Week commit history and this before/after ledger
- public YouTube demo under three minutes with voiceover
- `/feedback` session ID from the primary implementation task

