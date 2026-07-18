# Tier 1 — i-Tree-style Per-Tree & Planted-Tree Benefits

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface i-Tree-style annual and 30-year benefit estimates (CO₂, stormwater, air quality, energy) for existing trees in the inspector, and a 30-year benefit forecast for user-entered planted trees in the route summary. Both surfaces tag species with the Metro Vancouver future-climate suitability tier (Very Suitable / Suitable / Marginal) and invasive-potential flag.

**Architecture:** New `src/domain/benefits.js` pure module takes a normalized tree spec (`{species, dbhCm, condition, region}`) plus a year for planted-tree forecasts; looks up coefficients in `src/data/itree-coefficients.js`; returns a plain object of annual + cumulative numbers. UI layers are thin wrappers that call the module and render an `<dl>` (existing trees) or an inline SVG curve (planted trees). Coefficients are a flat JSON: i-Tree growth/benefit math for 25 anchor species + Metro Vancouver climate tier + invasive flag for ~120 species parsed from the public PDF. No external API, no i-Tree fork, citations inline in the data file header.

**Tech Stack:** Plain ES modules, vitest, MapLibre GL JS (existing). No new dependencies. SVG for the projection curve (no chart lib).

## Global Constraints

- **No new dependencies.** Use vanilla JS, vitest, and existing test setup.
- **File size cap:** files < 800 lines, functions < 100 lines.
- **Commits:** `type: description` (feat/fix/chore/docs/refactor/test).
- **Module style:** ES modules, named exports, JSDoc on every public function.
- **Testing:** vitest for unit; existing playwright e2e for one regression snapshot test.
- **Tree spec normalization:** the benefits module accepts a minimal shape and **never reads the full `tree` object**. Callers are responsible for extraction. This keeps the domain module pure and reusable for planted trees.
- **Citations:** every coefficient in `itree-coefficients.js` carries a `source` field naming the i-Tree publication or species table it came from.
- **No silent failures:** unknown species returns `null` (callers decide whether to show "data not available" or hide the section).
- **Climate signals (Metro Vancouver Urban Forest Climate Adaptation Initiative):** every coefficient entry carries `climateTier: 'very' | 'suitable' | 'marginal'` and `invasive: boolean` and `trial: boolean`. Source PDF: `https://metrovancouver.org/services/regional-planning/Documents/urban-forest-trees-list.pdf`. Parsed once at module init from the bundled text; the parser lives in `scripts/import-metro-species.js` and runs offline.
- **Planted-tree form behavior:** the form's species `<select>` shows only **Very Suitable, non-invasive** species by default. Users can opt in to "Show lower suitability" and "Show invasive species" via disclosure controls; doing so adds an explicit confirmation text. This is non-negotiable — the regional climate plan is a higher authority than user choice here.

## File Structure

| Path | Responsibility |
|---|---|
| `src/data/itree-coefficients.js` | Flat JSON: i-Tree growth & benefit coefficients (25 anchor species) merged with Metro Vancouver climate tier + invasive/trial flags (~120 species). Citations inline. |
| `src/data/itree-species-tier.json` | Intermediate: tier + invasive + trial metadata only, parsed from the Metro Vancouver PDF. |
| `scripts/seed/metro-trees.txt` | Committed `pdftotext` extract of the Metro Vancouver tree list. Source of truth for the import. |
| `scripts/import-metro-species.js` | One-shot Node script: reads the seed text, emits `itree-species-tier.json`. Offline, deterministic. |
| `src/domain/benefits.js` | Pure functions: `annualBenefitsFor(spec)`, `projectionFor(spec, years)`. No DOM. No fetches. |
| `src/ui/benefit-card.js` | DOM builder for the climate badge + 4-tile annual benefit `<dl>` shown in `tree-inspector.js`. |
| `src/ui/benefit-curve.js` | Inline SVG builder for the 30-year projection curve shown in route summary. |
| `tests/domain/benefits.test.js` | Unit tests for `src/domain/benefits.js`. |
| `tests/data/itree-coefficients.test.js` | Schema sanity test (≥100 species, climate tier + invasive on every entry, anchor species present). |
| `tests/ui/benefit-card.test.js` | jsdom test for the card: 4 tiles, climate badge, tier-only fallback, invasive warning, accessibility. |
| `src/ui/tree-inspector.js` | **Modified:** insert benefit card (with climate badge) below the facts section when `ITREE_COEFFICIENTS[speciesKey]` exists. |
| `src/ui/route-summary.js` | **Modified:** when the route contains at least one planted stop, append a 30-year projection summary line. |
| `src/ui/route-builder.js` | **Modified:** accept planted-tree stops with `planted: true` flag. |
| `src/ui/app-shell.js` | **Modified:** add a "Plant a tree" button next to "Add to route" in the inspector; opens the form. |
| `src/ui/planted-tree-form.js` | **New:** species + dbh + condition form. Defaults to Very Suitable, non-invasive species; "Show lower suitability" and "Show invasive species" disclosures; required acknowledgment for invasives. |
| `src/styles/benefits.css` | New styles for the 4-tile card, climate badge tiers, and the SVG curve. |
| `src/main.js` | **Modified:** wire `plantedTreeForm` submit handler into the existing state.addRouteStop flow. |

---

## Task 1: Coefficient Data File

**Files:**
- Create: `src/data/itree-coefficients.js`
- Create: `scripts/import-metro-species.js` (one-shot, offline; reads `scripts/seed/metro-trees.txt` and emits JSON)
- Create: `scripts/seed/metro-trees.txt` (the `pdftotext` extract from the Metro Vancouver PDF; committed to repo so the build is reproducible)
- Test: `tests/data/itree-coefficients.test.js`

**Interfaces:**
- Consumes: `scripts/seed/metro-trees.txt` (committed)
- Produces: `export const ITREE_COEFFICIENTS` — `Record<string, SpeciesCoefficients>`, where key is the canonical key `${GENUS}_${SPECIES}`. Each entry:
  ```js
  {
    commonName: string,
    growth: { // diameter growth cm/yr, by age band
      young: number,   // 0-15 yr
      mature: number,  // 15-40 yr
      old: number      // 40+ yr
    },
    benefits: {        // annual per cm dbh
      co2KgPerDbhCm: number,        // CO2 sequestered kg/yr per cm dbh
      co2StoredKgPerDbhCm: number,   // standing stock kg per cm dbh
      stormwaterLPerDbhCm: number,   // L/yr intercepted per cm dbh
      pollutantsGPerDbhCm: number,   // g/yr removed per cm dbh
      energyCadPerDbhCm: number      // $CAD/yr energy savings per cm dbh
    },
    climateTier: 'very' | 'suitable' | 'marginal',  // Metro Vancouver future-climate suitability
    invasive: boolean,                                // species flagged * in the PDF
    trial: boolean,                                   // species flagged • in the PDF
    source: string  // combined i-Tree + Metro Vancouver citation
  }
  ```
- The file holds **~120 species** (every species named in the Metro Vancouver list that overlaps with i-Tree's 25 anchor species plus the rest as tier-only entries with `growth` and `benefits` set to `0` and a `// ponytail: tier-only, no benefit math` comment in the `source` string). The 25 anchor species keep their full i-Tree coefficients.
- [ ] **Step 1: Commit the seed text**

Save the `pdftotext -layout` output to `scripts/seed/metro-trees.txt` (already done during planning). Commit it. No new code yet.

```bash
git add scripts/seed/metro-trees.txt
git commit -m "chore(data): commit Metro Vancouver tree list seed text"
```

- [ ] **Step 2: Write the parser (failing) → implement (passing)**

Create `scripts/import-metro-species.js` that:
1. Reads `scripts/seed/metro-trees.txt`.
2. Walks the three tier sections (`VERY SUITABLE`, `SUITABLE`, `MARGINAL`).
3. For each species line, extracts: latin name, tier, `invasive` from trailing `*`, `trial` from trailing `•`.
4. Emits a JSON file at `src/data/itree-species-tier.json` (intermediate, tier-only — no i-Tree math yet).

The file is run with `node scripts/import-metro-species.js`. No test for the parser itself (one-shot script); the contract is enforced by the data test in Step 3.

```bash
node scripts/import-metro-species.js
git add src/data/itree-species-tier.json scripts/import-metro-species.js
git commit -m "feat(data): import Metro Vancouver species tier and invasive flags"
```

- [ ] **Step 3: Write the failing schema test**

```js
// tests/data/itree-coefficients.test.js
import { describe, expect, it } from 'vitest';
import { ITREE_COEFFICIENTS } from '../../src/data/itree-coefficients.js';

describe('i-Tree coefficients', () => {
  it('exposes at least 100 species (Metro Vancouver coverage)', () => {
    expect(Object.keys(ITREE_COEFFICIENTS).length).toBeGreaterThanOrEqual(100);
  });

  it('every entry has climate tier and invasive flag', () => {
    for (const [key, entry] of Object.entries(ITREE_COEFFICIENTS)) {
      expect(['very', 'suitable', 'marginal'], key).toContain(entry.climateTier);
      expect(entry.invasive, key).toBeTypeOf('boolean');
      expect(entry.trial, key).toBeTypeOf('boolean');
    }
  });

  it('Acer rubrum is in the very or suitable tier and not invasive', () => {
    const r = ITREE_COEFFICIENTS['ACER_RUBRUM'];
    expect(r).toBeDefined();
    expect(r.climateTier).not.toBe('marginal');
    expect(r.invasive).toBe(false);
  });

  it('Acer platanoides is flagged invasive', () => {
    const r = ITREE_COEFFICIENTS['ACER_PLATANOIDES'];
    expect(r).toBeDefined();
    expect(r.invasive).toBe(true);
  });

  it('Garry Oak is very-suitable (regional priority species)', () => {
    expect(ITREE_COEFFICIENTS['QUERCUS_GARRYANA'].climateTier).toBe('very');
  });

  it('every entry has the required shape with finite numbers', () => {
    for (const [key, entry] of Object.entries(ITREE_COEFFICIENTS)) {
      expect(entry.commonName, key).toBeTypeOf('string');
      expect(entry.source, key).toBeTypeOf('string');
      for (const band of ['young', 'mature', 'old']) {
        expect(Number.isFinite(entry.growth[band]), `${key}.growth.${band}`).toBe(true);
      }
      for (const k of [
        'co2KgPerDbhCm',
        'co2StoredKgPerDbhCm',
        'stormwaterLPerDbhCm',
        'pollutantsGPerDbhCm',
        'energyCadPerDbhCm'
      ]) {
        expect(Number.isFinite(entry.benefits[k]), `${key}.benefits.${k}`).toBe(true);
        expect(entry.benefits[k], `${key}.benefits.${k}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('cites a source for every entry', () => {
    for (const [key, entry] of Object.entries(ITREE_COEFFICIENTS)) {
      expect(entry.source.length, key).toBeGreaterThan(10);
    }
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `bun test:unit -- tests/data/itree-coefficients.test.js`
Expected: FAIL with "Cannot find module '../../src/data/itree-coefficients.js'"

- [ ] **Step 5: Write the coefficient file**

Generate `src/data/itree-coefficients.js` by merging the 25 anchor species (with i-Tree growth + benefit math, see appendix at the bottom of this plan) over the Metro Vancouver tier data. Use a small Node script (run once, output committed) or hand-write the merge. The merged file looks like:

```js
// src/data/itree-coefficients.js
// i-Tree-style species coefficients for Vancouver street trees,
// merged with Metro Vancouver Urban Forest Climate Adaptation Initiative
// (https://metrovancouver.org/services/regional-planning/Documents/urban-forest-trees-list.pdf).
// Tier ('very'|'suitable'|'marginal') and invasive/trial flags come from Metro Vancouver.
// Growth + annual benefits come from i-Tree Species database (Nowak 2008, updated 2023).
// ponytail: 25 anchor species carry full i-Tree math; the remaining ~100 species
// ship tier/invasive metadata only (zero coefficients) and surface as 'climate
// data only' in the UI. Expand anchors only when a species crosses 1% of the
// municipal inventory by frequency.

import metroTiers from './itree-species-tier.json';

const ANCHOR_COEFFICIENTS = {
  ACER_RUBRUM: {
    commonName: 'Red Maple',
    growth: { young: 0.7, mature: 0.5, old: 0.2 },
    benefits: {
      co2KgPerDbhCm: 0.45,
      co2StoredKgPerDbhCm: 3.8,
      stormwaterLPerDbhCm: 7.2,
      pollutantsGPerDbhCm: 0.18,
      energyCadPerDbhCm: 0.04
    }
  },
  ACER_MACROPHYLLUM: { /* ... 23 more anchors ... */ }
  // see appendix in this plan for the full anchor list
};

const ZERO_BENEFITS = {
  co2KgPerDbhCm: 0,
  co2StoredKgPerDbhCm: 0,
  stormwaterLPerDbhCm: 0,
  pollutantsGPerDbhCm: 0,
  energyCadPerDbhCm: 0
};

const ZERO_GROWTH = { young: 0, mature: 0, old: 0 };

export const ITREE_COEFFICIENTS = {};
for (const [key, tierEntry] of Object.entries(metroTiers)) {
  const anchor = ANCHOR_COEFFICIENTS[key];
  ITREE_COEFFICIENTS[key] = {
    commonName: (anchor && anchor.commonName) || tierEntry.commonName,
    growth: (anchor && anchor.growth) || ZERO_GROWTH,
    benefits: (anchor && anchor.benefits) || ZERO_BENEFITS,
    climateTier: tierEntry.climateTier,
    invasive: tierEntry.invasive,
    trial: tierEntry.trial,
    source: anchor
      ? `i-Tree Species database (Nowak 2008); Metro Vancouver Urban Forest Climate Adaptation Initiative 2022.`
      : `Metro Vancouver Urban Forest Climate Adaptation Initiative 2022 — tier-only, no benefit math.`
  };
}

// Ensure every anchor species is in the merged file even if Metro Vancouver didn't list it
for (const [key, anchor] of Object.entries(ANCHOR_COEFFICIENTS)) {
  if (!ITREE_COEFFICIENTS[key]) {
    ITREE_COEFFICIENTS[key] = {
      ...anchor,
      climateTier: 'suitable', // default conservative tier
      invasive: false,
      trial: false,
      source: 'i-Tree Species database only; not in Metro Vancouver list.'
    };
  }
}
```

> Implementer: copy the 25-anchor block from the appendix below and paste into `ANCHOR_COEFFICIENTS`. Run the import script, run the merge, write the file, run the test.

- [ ] **Step 6: Run test to verify it passes**

Run: `bun test:unit -- tests/data/itree-coefficients.test.js`
Expected: PASS for all 7 cases.

- [ ] **Step 7: Commit**

```bash
git add src/data/itree-coefficients.js
git commit -m "feat(data): merge i-Tree anchor coefficients with Metro Vancouver tiers"
```

**Appendix — 25 anchor species (i-Tree coefficients):** the 5 entries shown in the original plan (ACER_RUBRUM, ACER_MACROPHYLLUM, ACER_PLATANOIDES, QUERCUS_GARRYANA, THUJA_PLICATA) plus 20 more: TSUGA_HETEROPHYLLA, PSEUDOTSUGA_MENZIESII, BETULA_PAPYRIFERA, FRAXINUS_LATIFOLIA, PRUNUS_SERRULATA, MALUS_DOMESTICA, PYRUS_CALLERYANA, PRUNUS_AVIUM, CORNUS_NUTTALLII, MAGNOLIA_GRANDIFLORA, LIQUIDAMBAR_STYRACIFLUA, PLATANUS_X_ACERIFOLIA, TILIA_CORDATA, ULMUS_AMERICANA, ZELKOVA_SERRATA, GLEDITSIA_TRIACANTHOS, ROBINIA_PSEUDOACACIA, GINKGO_BILOBA, LARIX_DECIDUA, PINUS_STROBUS. Use the same coefficient shape as the 5 samples; values from i-Tree Species public tables; if a coefficient is unknown, use `0` and add a `// ponytail: approximate` comment.

---

## Task 2: Annual Benefits Domain Function

**Files:**
- Create: `src/domain/benefits.js`
- Test: `tests/domain/benefits.test.js`

**Interfaces:**
- Consumes: `ITREE_COEFFICIENTS` from Task 1.
- Produces: `annualBenefitsFor(spec) -> AnnualBenefits | null`
  - `spec = { speciesKey: string, dbhCm: number, condition?: 'good'|'fair'|'poor' }`
  - Returns `{ co2Kg, co2StoredKg, stormwaterL, pollutantsG, energyCad, source }` or `null` if `speciesKey` not in coefficients.
  - `condition` multiplier: `good=1.0`, `fair=0.7`, `poor=0.4`. Default `good`.

- [ ] **Step 1: Write the failing tests**

```js
// tests/domain/benefits.test.js
import { describe, expect, it } from 'vitest';
import { annualBenefitsFor } from '../../src/domain/benefits.js';

describe('annualBenefitsFor', () => {
  it('returns null for unknown species', () => {
    expect(annualBenefitsFor({ speciesKey: 'NOPE_FAKE', dbhCm: 30 })).toBeNull();
  });

  it('computes a positive benefit set for a known species', () => {
    const result = annualBenefitsFor({ speciesKey: 'ACER_RUBRUM', dbhCm: 40 });
    expect(result).toMatchObject({
      co2Kg: 18,           // 0.45 * 40
      co2StoredKg: 152,    // 3.8 * 40
      stormwaterL: 288,    // 7.2 * 40
      pollutantsG: 7.2,    // 0.18 * 40
      energyCad: 1.6,      // 0.04 * 40
      source: expect.stringContaining('i-Tree')
    });
  });

  it('scales linearly with dbh', () => {
    const small = annualBenefitsFor({ speciesKey: 'ACER_RUBRUM', dbhCm: 10 });
    const large = annualBenefitsFor({ speciesKey: 'ACER_RUBRUM', dbhCm: 30 });
    expect(large.co2Kg / small.co2Kg).toBeCloseTo(3, 5);
  });

  it('applies condition multiplier', () => {
    const good = annualBenefitsFor({ speciesKey: 'ACER_RUBRUM', dbhCm: 40, condition: 'good' });
    const poor = annualBenefitsFor({ speciesKey: 'ACER_RUBRUM', dbhCm: 40, condition: 'poor' });
    expect(poor.co2Kg / good.co2Kg).toBeCloseTo(0.4, 5);
  });

  it('rounds co2Kg to 1 decimal and co2StoredKg to integer', () => {
    const r = annualBenefitsFor({ speciesKey: 'ACER_RUBRUM', dbhCm: 17 });
    expect(Number.isInteger(r.co2StoredKg)).toBe(true);
    expect(Math.round(r.co2Kg * 10) / 10).toBe(r.co2Kg);
  });

  it('returns null for non-finite dbh', () => {
    expect(annualBenefitsFor({ speciesKey: 'ACER_RUBRUM', dbhCm: NaN })).toBeNull();
    expect(annualBenefitsFor({ speciesKey: 'ACER_RUBRUM', dbhCm: -1 })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test:unit -- tests/domain/benefits.test.js`
Expected: FAIL with "Cannot find module '../../src/domain/benefits.js'"

- [ ] **Step 3: Implement the function**

```js
// src/domain/benefits.js
import { ITREE_COEFFICIENTS } from '../data/itree-coefficients.js';

const CONDITION_FACTORS = { good: 1, fair: 0.7, poor: 0.4 };

/**
 * Compute annual i-Tree-style ecosystem benefits for one tree.
 * @param {{speciesKey: string, dbhCm: number, condition?: 'good'|'fair'|'poor'}} spec
 * @returns {null | {co2Kg:number, co2StoredKg:number, stormwaterL:number, pollutantsG:number, energyCad:number, source:string}}
 */
export function annualBenefitsFor(spec) {
  if (!spec || !Number.isFinite(spec.dbhCm) || spec.dbhCm < 0) return null;
  const coeff = ITREE_COEFFICIENTS[spec.speciesKey];
  if (!coeff) return null;
  const condition = CONDITION_FACTORS[spec.condition ?? 'good'] ?? 1;
  const dbh = spec.dbhCm;
  return {
    co2Kg: round(coeff.benefits.co2KgPerDbhCm * dbh * condition, 1),
    co2StoredKg: Math.round(coeff.benefits.co2StoredKgPerDbhCm * dbh * condition),
    stormwaterL: Math.round(coeff.benefits.stormwaterLPerDbhCm * dbh * condition),
    pollutantsG: round(coeff.benefits.pollutantsGPerDbhCm * dbh * condition, 1),
    energyCad: round(coeff.benefits.energyCadPerDbhCm * dbh * condition, 2),
    source: coeff.source
  };
}

function round(value, places) {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test:unit -- tests/domain/benefits.test.js`
Expected: PASS for all 6 cases.

- [ ] **Step 5: Commit**

```bash
git add src/domain/benefits.js tests/domain/benefits.test.js
git commit -m "feat(domain): add annualBenefitsFor with condition and dbh scaling"
```

---

## Task 3: 30-Year Projection Function

**Files:**
- Modify: `src/domain/benefits.js`
- Test: `tests/domain/benefits.test.js`

**Interfaces:**
- Produces: `projectionFor(spec, years = 30) -> ProjectionPoint[] | null`
  - `spec = { speciesKey: string, plantedDbhCm?: number, condition?: 'good'|'fair'|'poor' }` (no current `dbhCm` — planted trees start at planting size)
  - Default `plantedDbhCm = 2` (typical 5-gal sapling).
  - Returns `Array<{ year: number, dbhCm: number, co2Kg: number, stormwaterL: number, cumulativeCo2Kg: number, cumulativeStormwaterL: number }>` with one entry per year from 1 to `years`.
  - DBH grows by `growth.young` until 15 yr, `growth.mature` until 40 yr, `growth.old` thereafter.
  - Each year's benefits use the **current year** DBH (i.e. larger trees sequester more).
  - Cumulative columns sum from year 1 forward.
  - Returns `null` if `speciesKey` unknown.

- [ ] **Step 1: Add failing tests to existing file**

Append to `tests/domain/benefits.test.js`:

```js
import { projectionFor } from '../../src/domain/benefits.js';

describe('projectionFor', () => {
  it('returns null for unknown species', () => {
    expect(projectionFor({ speciesKey: 'NOPE_FAKE' })).toBeNull();
  });

  it('returns 30 yearly points by default', () => {
    const points = projectionFor({ speciesKey: 'ACER_RUBRUM' });
    expect(points).toHaveLength(30);
    expect(points[0].year).toBe(1);
    expect(points[29].year).toBe(30);
  });

  it('dbh grows monotonically and slows after year 40', () => {
    const points = projectionFor({ speciesKey: 'ACER_RUBRUM' }, 50);
    for (let i = 1; i < points.length; i += 1) {
      expect(points[i].dbhCm).toBeGreaterThanOrEqual(points[i - 1].dbhCm);
    }
    // growth.young = 0.7 until yr 15, mature = 0.5 until 40, old = 0.2 after
    const y15 = points[14].dbhCm; // year 15 index
    const y40 = points[39].dbhCm;
    const y50 = points[49].dbhCm;
    expect(y50 - y40).toBeLessThan(y40 - y15);
  });

  it('cumulative co2 equals sum of yearly co2', () => {
    const points = projectionFor({ speciesKey: 'ACER_RUBRUM' }, 10);
    const sum = points.reduce((acc, p) => acc + p.co2Kg, 0);
    expect(points[9].cumulativeCo2Kg).toBeCloseTo(round1(sum), 1);
  });

  it('starts at the planted dbh when plantedDbhCm is provided', () => {
    const points = projectionFor({ speciesKey: 'ACER_RUBRUM', plantedDbhCm: 10 }, 1);
    expect(points[0].dbhCm).toBe(10);
  });
});

function round1(n) { return Math.round(n * 10) / 10; }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test:unit -- tests/domain/benefits.test.js`
Expected: FAIL with "projectionFor is not a function"

- [ ] **Step 3: Add `projectionFor` to `src/domain/benefits.js`**

Add to the same file (after `annualBenefitsFor`):

```js
/**
 * Project yearly benefits for a planted tree over `years` years.
 * DBH grows by species coefficients: young (0-15 yr), mature (15-40 yr), old (40+ yr).
 * @param {{speciesKey: string, plantedDbhCm?: number, condition?: 'good'|'fair'|'poor'}} spec
 * @param {number} [years=30]
 * @returns {null | Array<{year:number, dbhCm:number, co2Kg:number, stormwaterL:number, cumulativeCo2Kg:number, cumulativeStormwaterL:number}>}
 */
export function projectionFor(spec, years = 30) {
  if (!spec) return null;
  const coeff = ITREE_COEFFICIENTS[spec.speciesKey];
  if (!coeff) return null;
  const condition = CONDITION_FACTORS[spec.condition ?? 'good'] ?? 1;
  const points = [];
  let dbh = spec.plantedDbhCm ?? 2;
  let cumCo2 = 0;
  let cumWater = 0;
  for (let year = 1; year <= years; year += 1) {
    const annual = annualBenefitsFor({ speciesKey: spec.speciesKey, dbhCm: dbh, condition: spec.condition });
    cumCo2 += annual.co2Kg;
    cumWater += annual.stormwaterL;
    points.push({
      year,
      dbhCm: round(dbh, 1),
      co2Kg: annual.co2Kg,
      stormwaterL: annual.stormwaterL,
      cumulativeCo2Kg: round(cumCo2, 1),
      cumulativeStormwaterL: Math.round(cumWater)
    });
    if (year < 15) dbh += coeff.growth.young;
    else if (year < 40) dbh += coeff.growth.mature;
    else dbh += coeff.growth.old;
  }
  return points;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test:unit -- tests/domain/benefits.test.js`
Expected: PASS for all 11 cases (6 from Task 2 + 5 new).

- [ ] **Step 5: Commit**

```bash
git add src/domain/benefits.js tests/domain/benefits.test.js
git commit -m "feat(domain): add 30-year projectionFor for planted trees"
```

---

## Task 4: Benefit Card DOM Builder

**Files:**
- Create: `src/ui/benefit-card.js`
- Test: `tests/ui/benefit-card.test.js`
- Create: `src/styles/benefits.css`

**Interfaces:**
- Consumes: `annualBenefitsFor` from Task 2, `ITREE_COEFFICIENTS` from Task 1.
- Produces: `createBenefitCard(annualBenefits, climateMeta) -> HTMLElement | null`
  - `annualBenefits` — the object from `annualBenefitsFor`, or `null` when no benefit math.
  - `climateMeta` — `{ tier: 'very'|'suitable'|'marginal', invasive: boolean, trial: boolean, source: string }` (or `null`).
  - Returns a `<section class="benefit-card">` with: a **climate-suitability badge** at the top, then (if `annualBenefits`) 4 benefit tiles, or (if only `climateMeta`) a "Climate data only — no benefit estimate yet" message. Returns `null` only when both are missing.
  - Badge text: tier label + invasive/trial warnings if applicable. Link to `https://metrovancouver.org/services/regional-planning/Documents/urban-forest-trees-list.pdf`.

- [ ] **Step 1: Write the failing test**

```js
// tests/ui/benefit-card.test.js
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { createBenefitCard } from '../../src/ui/benefit-card.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
global.document = dom.window.document;

const sampleBenefits = {
  co2Kg: 18, co2StoredKg: 152, stormwaterL: 288, pollutantsG: 7.2, energyCad: 1.6,
  source: 'i-Tree Species database, Acer rubrum.'
};
const sampleMeta = { tier: 'very', invasive: false, trial: false, source: 'Metro Vancouver list' };

describe('createBenefitCard', () => {
  it('returns null when both benefits and climateMeta are null', () => {
    expect(createBenefitCard(null, null)).toBeNull();
  });

  it('renders four tiles with formatted values when benefits present', () => {
    const card = createBenefitCard(sampleBenefits, sampleMeta);
    expect(card.className).toBe('benefit-card');
    const tiles = card.querySelectorAll('.benefit-tile');
    expect(tiles).toHaveLength(4);
    const labels = [...tiles].map(t => t.querySelector('dt').textContent);
    expect(labels).toEqual(['CO₂ per year', 'Stormwater', 'Air quality', 'Energy savings']);
  });

  it('renders the climate-suitability badge with tier label', () => {
    const card = createBenefitCard(sampleBenefits, sampleMeta);
    const badge = card.querySelector('.climate-badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent.toLowerCase()).toContain('very suitable');
    expect(badge.textContent.toLowerCase()).not.toContain('invasive');
  });

  it('shows the invasive warning when invasive is true', () => {
    const card = createBenefitCard(sampleBenefits, { ...sampleMeta, invasive: true });
    expect(card.querySelector('.climate-badge').textContent.toLowerCase()).toContain('invasive');
  });

  it('shows the trial notice when trial is true', () => {
    const card = createBenefitCard(sampleBenefits, { ...sampleMeta, trial: true });
    expect(card.querySelector('.climate-badge').textContent.toLowerCase()).toContain('trial');
  });

  it('uses accessible list semantics for tiles', () => {
    const card = createBenefitCard(sampleBenefits, sampleMeta);
    const list = card.querySelector('dl.benefit-tiles');
    expect(list).not.toBeNull();
    expect(list.querySelectorAll('dt')).toHaveLength(4);
    expect(list.querySelectorAll('dd')).toHaveLength(4);
  });

  it('falls back to climate-data-only message when benefits are null', () => {
    const card = createBenefitCard(null, sampleMeta);
    expect(card.querySelector('.benefit-tiles')).toBeNull();
    expect(card.textContent.toLowerCase()).toContain('climate data only');
  });

  it('cites both i-Tree and Metro Vancouver when both apply', () => {
    const card = createBenefitCard(sampleBenefits, sampleMeta);
    const caption = card.querySelector('.benefit-source');
    expect(caption.textContent).toContain('i-Tree');
    expect(caption.textContent.toContain('Metro Vancouver') || caption.innerHTML.includes('metrovancouver.org')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test:unit -- tests/ui/benefit-card.test.js`
Expected: FAIL with "Cannot find module '../../src/ui/benefit-card.js'"

- [ ] **Step 3: Implement the card builder**

```js
// src/ui/benefit-card.js
const TIER_LABELS = {
  very: 'Very suitable for future Metro Vancouver climate',
  suitable: 'Suitable for future Metro Vancouver climate',
  marginal: 'Marginal — restrict to moist sites'
};
const METRO_URL = 'https://metrovancouver.org/services/regional-planning/Documents/urban-forest-trees-list.pdf';

/**
 * @param {null | {co2Kg:number, co2StoredKg:number, stormwaterL:number, pollutantsG:number, energyCad:number, source:string}} benefits
 * @param {null | {tier:'very'|'suitable'|'marginal', invasive:boolean, trial:boolean, source:string}} climateMeta
 * @returns {HTMLElement | null}
 */
export function createBenefitCard(benefits, climateMeta) {
  if (!benefits && !climateMeta) return null;
  const section = document.createElement('section');
  section.className = 'benefit-card';
  const title = document.createElement('h2');
  title.textContent = 'Annual benefits';
  section.append(title);

  if (climateMeta) {
    section.append(createBadge(climateMeta));
  }

  if (benefits) {
    const subtitle = document.createElement('p');
    subtitle.className = 'benefit-subtitle';
    subtitle.textContent = 'Estimated ecosystem services per year, based on i-Tree species coefficients.';
    section.append(subtitle);
    const list = document.createElement('dl');
    list.className = 'benefit-tiles';
    list.append(
      tile('CO₂ per year', `${benefits.co2Kg} kg`, `${benefits.co2StoredKg} kg stored to date`),
      tile('Stormwater', `${benefits.stormwaterL.toLocaleString()} L`, 'rainfall intercepted'),
      tile('Air quality', `${benefits.pollutantsG} g`, 'pollutants removed'),
      tile('Energy savings', `$${benefits.energyCad.toFixed(2)}`, 'from canopy shade')
    );
    section.append(list);
  } else {
    const note = document.createElement('p');
    note.className = 'benefit-tier-only';
    note.textContent = 'Climate data only — benefit estimate not available for this species yet.';
    section.append(note);
  }

  const caption = document.createElement('p');
  caption.className = 'benefit-source';
  if (benefits) {
    const itree = document.createElement('a');
    itree.href = 'https://www.itreetools.org/tools';
    itree.target = '_blank';
    itree.rel = 'noopener noreferrer';
    itree.textContent = 'i-Tree Tools';
    caption.append(document.createTextNode('Source: '), itree, document.createTextNode('. ' + benefits.source));
  }
  if (climateMeta) {
    const metro = document.createElement('a');
    metro.href = METRO_URL;
    metro.target = '_blank';
    metro.rel = 'noopener noreferrer';
    metro.textContent = 'Metro Vancouver Urban Forest Climate Adaptation Initiative';
    caption.append(document.createTextNode(' Climate tier: '), metro, document.createTextNode('.'));
  }
  section.append(caption);
  return section;
}

function createBadge(meta) {
  const badge = document.createElement('p');
  badge.className = `climate-badge tier-${meta.tier}${meta.invasive ? ' invasive' : ''}${meta.trial ? ' trial' : ''}`;
  const parts = [TIER_LABELS[meta.tier] || meta.tier];
  if (meta.invasive) parts.push('Invasive potential — avoid planting where seeds can disperse.');
  if (meta.trial) parts.push('Trial species — present in comparable future climates.');
  badge.textContent = parts.join('. ');
  return badge;
}

function tile(label, value, hint) {
  const wrapper = document.createElement('div');
  wrapper.className = 'benefit-tile';
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  const valueEl = document.createElement('strong');
  valueEl.textContent = value;
  const hintEl = document.createElement('span');
  hintEl.className = 'benefit-hint';
  hintEl.textContent = hint;
  dd.append(valueEl, hintEl);
  wrapper.append(dt, dd);
  return wrapper;
}
```

- [ ] **Step 4: Add minimal styles**

```css
/* src/styles/benefits.css */
.benefit-card {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--surface-2, #f4f1ea);
}
.benefit-card h2 { margin: 0 0 0.25rem; font-size: 1rem; }
.benefit-subtitle { margin: 0 0 0.75rem; color: var(--text-2, #4a4a4a); font-size: 0.85rem; }
.climate-badge {
  display: inline-block;
  margin: 0 0 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  background: var(--surface-1, #fff);
  border-left: 3px solid var(--text-3, #6a6a6a);
}
.climate-badge.tier-very { border-left-color: #2e7d32; }
.climate-badge.tier-suitable { border-left-color: #558b2f; }
.climate-badge.tier-marginal { border-left-color: #ef6c00; }
.climate-badge.invasive { background: #fdecea; border-left-color: #c62828; color: #8b1a1a; }
.climate-badge.trial { font-style: italic; }
.benefit-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  margin: 0;
}
.benefit-tile {
  background: var(--surface-1, #fff);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
}
.benefit-tile dt { font-size: 0.75rem; color: var(--text-2, #4a4a4a); }
.benefit-tile dd { margin: 0; }
.benefit-tile strong { font-size: 1.1rem; }
.benefit-hint { display: block; font-size: 0.7rem; color: var(--text-3, #6a6a6a); }
.benefit-tier-only { font-size: 0.85rem; color: var(--text-2, #4a4a4a); margin: 0 0 0.5rem; }
.benefit-source { margin: 0.75rem 0 0; font-size: 0.75rem; color: var(--text-3, #6a6a6a); }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun test:unit -- tests/ui/benefit-card.test.js`
Expected: PASS for all 7 cases.

- [ ] **Step 6: Commit**

```bash
git add src/ui/benefit-card.js src/styles/benefits.css tests/ui/benefit-card.test.js
git commit -m "feat(ui): add climate-tier badge and tier-only fallback to benefit card"
```

> Implementer note: Task 5 (wiring the card into the tree inspector) is updated in lockstep — `createBenefitCard(benefits, climateMeta)` now takes two args, and `tree-inspector.js` looks up `ITREE_COEFFICIENTS[speciesKey]` to build `climateMeta` whenever it looks up the benefits.

---

## Task 5: Wire Benefit Card into Tree Inspector

**Files:**
- Modify: `src/ui/tree-inspector.js:1` (add import after `maskHasMonth` import)
- Modify: `src/ui/tree-inspector.js:136` (insert card before the `root.append` final line)

**Interfaces:**
- Consumes: `createBenefitCard(benefits, climateMeta)` from Task 4, `annualBenefitsFor` from Task 2, `ITREE_COEFFICIENTS` from Task 1.
- Produces: when a tree has both `tree.genus` and `tree.species` set, look up `speciesKey = ${tree.genus.toUpperCase()}_${tree.species.toUpperCase()}`. Read the matching `ITREE_COEFFICIENTS[speciesKey]` entry to build `climateMeta` (tier/invasive/trial). If `tree.diameterCm` is present, also call `annualBenefitsFor` for the benefit math. Pass both into `createBenefitCard` and insert the card before the closing append. Card renders even when only `climateMeta` is present (tier-only fallback).

- [ ] **Step 1: Write a regression test for the inspector wiring**

Append to `tests/ui/benefit-card.test.js`:

```js
import { renderTreeInspector } from '../../src/ui/tree-inspector.js';
import { ITREE_COEFFICIENTS } from '../../src/data/itree-coefficients.js';

describe('renderTreeInspector integrates benefit card', () => {
  it('shows benefit tiles when species and diameter are known', () => {
    const root = document.createElement('div');
    const tree = {
      commonName: 'Red Maple',
      genus: 'ACER', species: 'RUBRUM',
      diameterCm: 30, heightM: 12,
      address: 'Main St', latitude: 49.27, longitude: -123.1
    };
    renderTreeInspector(root, tree, { onRoute: () => {}, routeStopIndex: null });
    expect(root.querySelector('.benefit-card')).not.toBeNull();
    expect(root.querySelectorAll('.benefit-tile')).toHaveLength(4);
  });

  it('shows the climate badge with tier label even when diameter is missing', () => {
    const root = document.createElement('div');
    const tree = {
      commonName: 'Red Maple',
      genus: 'ACER', species: 'RUBRUM',
      latitude: 49.27, longitude: -123.1
    };
    renderTreeInspector(root, tree, { onRoute: () => {}, routeStopIndex: null });
    const card = root.querySelector('.benefit-card');
    expect(card).not.toBeNull();
    expect(card.querySelector('.climate-badge')).not.toBeNull();
    expect(card.querySelectorAll('.benefit-tile')).toHaveLength(0);
    expect(card.textContent.toLowerCase()).toContain('climate data only');
  });

  it('omits the benefit card entirely when species coefficients are unknown', () => {
    const root = document.createElement('div');
    const tree = {
      commonName: 'Mystery Tree',
      genus: 'NOPE', species: 'FAKE',
      diameterCm: 30, heightM: 12,
      latitude: 49.27, longitude: -123.1
    };
    renderTreeInspector(root, tree, { onRoute: () => {}, routeStopIndex: null });
    expect(root.querySelector('.benefit-card')).toBeNull();
  });

  it('shows the invasive warning badge for Acer platanoides', () => {
    const root = document.createElement('div');
    const tree = {
      commonName: 'Norway Maple',
      genus: 'ACER', species: 'PLATANOIDES',
      diameterCm: 30, heightM: 12,
      latitude: 49.27, longitude: -123.1
    };
    renderTreeInspector(root, tree, { onRoute: () => {}, routeStopIndex: null });
    const badge = root.querySelector('.climate-badge');
    expect(badge).not.toBeNull();
    expect(badge.classList.contains('invasive')).toBe(true);
    expect(badge.textContent.toLowerCase()).toContain('invasive');
  });

  it('every benefit-card test depends on at least 100 species in the coefficient file', () => {
    expect(Object.keys(ITREE_COEFFICIENTS).length).toBeGreaterThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test:unit -- tests/ui/benefit-card.test.js`
Expected: new tests FAIL (no `.benefit-card` rendered).

- [ ] **Step 3: Modify `src/ui/tree-inspector.js`**

Add at the top (after existing imports):

```js
import { annualBenefitsFor } from '../domain/benefits.js';
import { createBenefitCard } from './benefit-card.js';
import { ITREE_COEFFICIENTS } from '../data/itree-coefficients.js';
```

Inside `renderTreeInspector`, immediately before `root.append(header, location, actions, phenology, factsSection);` (line 136), add:

```js
  const card = buildBenefitsCard(tree);
  if (card) root.append(card);
```

And add a new helper function near the other helpers (above `function createPhenology`):

```js
function buildBenefitsCard(tree) {
  if (!tree.genus || !tree.species) return null;
  const speciesKey = `${String(tree.genus).toUpperCase()}_${String(tree.species).toUpperCase()}`;
  const entry = ITREE_COEFFICIENTS[speciesKey];
  if (!entry) return null;
  const climateMeta = {
    tier: entry.climateTier,
    invasive: entry.invasive,
    trial: entry.trial,
    source: entry.source
  };
  const benefits = tree.diameterCm
    ? annualBenefitsFor({ speciesKey, dbhCm: tree.diameterCm })
    : null;
  return createBenefitCard(benefits, climateMeta);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test:unit -- tests/ui/benefit-card.test.js`
Expected: all 12 cases PASS (7 from Task 4 + 5 from Task 5).

- [ ] **Step 5: Commit**

```bash
git add src/ui/tree-inspector.js tests/ui/benefit-card.test.js
git commit -m "feat(ui): render climate badge and benefit card in tree inspector"
```

---

## Task 6: Planted Tree Form (UI)

**Files:**
- Create: `src/ui/planted-tree-form.js`
- Test: `tests/ui/planted-tree-form.test.js`

**Interfaces:**
- Produces: `renderPlantedTreeForm(root, { onSubmit, onCancel, speciesOptions, defaultOptions }) -> void`
  - `speciesOptions` — full `Array<{ value, label, tier, invasive, trial }>` derived from `ITREE_COEFFICIENTS`.
  - `defaultOptions` — same shape, filtered to **Very Suitable, non-invasive, non-trial** species. This is what the `<select>` shows by default.
  - Form fields: species `<select>` (default view + "Show lower suitability" / "Show invasive species" disclosure), diameter `<input type="number">`, condition `<select>` (good/fair/poor).
  - When the user reveals a marginal/suitable species, an inline warning renders: *"This species is in the Marginal tier — only suitable for moist sites under future climate."*
  - When the user reveals an invasive species, a confirmation checkbox is required: *"I understand this species can self-seed. [ ] I will manage dispersal."*
  - Submit calls `onSubmit({ speciesKey, plantedDbhCm, condition })` — disabled until any required warnings are acknowledged.
  - `onCancel` clears and removes the form.

- [ ] **Step 1: Write the failing tests**

```js
// tests/ui/planted-tree-form.test.js
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
global.document = dom.window.document;
import { renderPlantedTreeForm, filterDefaultSpecies } from '../../src/ui/planted-tree-form.js';
import { ITREE_COEFFICIENTS } from '../../src/data/itree-coefficients.js';

const speciesOptions = Object.entries(ITREE_COEFFICIENTS).map(([value, e]) => ({
  value, label: e.commonName, tier: e.climateTier, invasive: e.invasive, trial: e.trial
}));
const defaultOptions = filterDefaultSpecies(speciesOptions);

describe('filterDefaultSpecies', () => {
  it('keeps only very-suitable, non-invasive, non-trial species', () => {
    for (const opt of defaultOptions) {
      expect(opt.tier).toBe('very');
      expect(opt.invasive).toBe(false);
      expect(opt.trial).toBe(false);
    }
  });

  it('returns a strict subset of the input', () => {
    expect(defaultOptions.length).toBeLessThan(speciesOptions.length);
  });
});

describe('renderPlantedTreeForm', () => {
  it('renders a select, two number/select inputs, and submit/cancel buttons', () => {
    const root = document.createElement('div');
    renderPlantedTreeForm(root, { onSubmit: () => {}, onCancel: () => {}, speciesOptions, defaultOptions });
    expect(root.querySelector('select[name="speciesKey"]')).not.toBeNull();
    expect(root.querySelector('input[name="plantedDbhCm"]')).not.toBeNull();
    expect(root.querySelector('select[name="condition"]')).not.toBeNull();
    expect(root.querySelector('button[type="submit"]')).not.toBeNull();
    expect(root.querySelector('button.cancel')).not.toBeNull();
  });

  it('shows the default options (very-suitable only) on first render', () => {
    const root = document.createElement('div');
    renderPlantedTreeForm(root, { onSubmit: () => {}, onCancel: () => {}, speciesOptions, defaultOptions });
    const opts = root.querySelectorAll('select[name="speciesKey"] option');
    for (const o of opts) {
      const meta = speciesOptions.find(s => s.value === o.value);
      expect(meta.tier, o.value).toBe('very');
      expect(meta.invasive, o.value).toBe(false);
    }
  });

  it('disclosure "Show lower suitability" reveals suitable and marginal species', () => {
    const root = document.createElement('div');
    renderPlantedTreeForm(root, { onSubmit: () => {}, onCancel: () => {}, speciesOptions, defaultOptions });
    root.querySelector('button.disclose-suitability').click();
    const opts = root.querySelectorAll('select[name="speciesKey"] option');
    const tiers = new Set([...opts].map(o => speciesOptions.find(s => s.value === o.value).tier));
    expect(tiers.has('suitable') || tiers.has('marginal')).toBe(true);
  });

  it('submits with the entered values for a default species', () => {
    const root = document.createElement('div');
    let captured = null;
    renderPlantedTreeForm(root, { onSubmit: (v) => { captured = v; }, onCancel: () => {}, speciesOptions, defaultOptions });
    const firstDefault = defaultOptions[0].value;
    root.querySelector('select[name="speciesKey"]').value = firstDefault;
    root.querySelector('input[name="plantedDbhCm"]').value = '5';
    root.querySelector('select[name="condition"]').value = 'fair';
    root.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(captured).toEqual({ speciesKey: firstDefault, plantedDbhCm: 5, condition: 'fair' });
  });

  it('blocks submit of an invasive species until the dispersal checkbox is checked', () => {
    const root = document.createElement('div');
    let captured = null;
    renderPlantedTreeForm(root, { onSubmit: (v) => { captured = v; }, onCancel: () => {}, speciesOptions, defaultOptions });
    root.querySelector('button.disclose-invasive').click();
    const invasiveOpt = speciesOptions.find(o => o.invasive);
    root.querySelector('select[name="speciesKey"]').value = invasiveOpt.value;
    root.querySelector('input[name="plantedDbhCm"]').value = '5';
    const submit = root.querySelector('button[type="submit"]');
    expect(submit.disabled).toBe(true);
    root.querySelector('input[name="invasiveAck"]').checked = true;
    root.querySelector('input[name="invasiveAck"]').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(submit.disabled).toBe(false);
    root.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(captured).toEqual({ speciesKey: invasiveOpt.value, plantedDbhCm: 5, condition: 'good' });
  });

  it('cancel calls onCancel and clears the root', () => {
    const root = document.createElement('div');
    let cancelled = false;
    renderPlantedTreeForm(root, { onSubmit: () => {}, onCancel: () => { cancelled = true; }, speciesOptions, defaultOptions });
    root.querySelector('button.cancel').click();
    expect(cancelled).toBe(true);
    expect(root.children).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test:unit -- tests/ui/planted-tree-form.test.js`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement the form**

```js
// src/ui/planted-tree-form.js

/**
 * Default filter for the planted-tree form: only species Metro Vancouver
 * rates as Very Suitable for future climate, that aren't invasive, and that
 * aren't trial/experimental. Used as the initial <select> options.
 */
export function filterDefaultSpecies(speciesOptions) {
  return speciesOptions.filter(o => o.tier === 'very' && !o.invasive && !o.trial);
}

/**
 * @param {HTMLElement} root
 * @param {{
 *   onSubmit:(v:{speciesKey:string,plantedDbhCm:number,condition:'good'|'fair'|'poor'})=>void,
 *   onCancel:()=>void,
 *   speciesOptions:Array<{value:string,label:string,tier:string,invasive:boolean,trial:boolean}>,
 *   defaultOptions:Array<{value:string,label:string,tier:string,invasive:boolean,trial:boolean}>
 * }} opts
 */
export function renderPlantedTreeForm(root, { onSubmit, onCancel, speciesOptions, defaultOptions }) {
  root.replaceChildren();
  const form = document.createElement('form');
  form.className = 'planted-tree-form';

  // Species select (initially shows defaults; disclosures add more)
  const speciesField = document.createElement('label');
  speciesField.className = 'form-field';
  const speciesLbl = document.createElement('span');
  speciesLbl.textContent = 'Species (Metro Vancouver future-climate list)';
  const speciesSelect = document.createElement('select');
  speciesSelect.name = 'speciesKey';
  speciesSelect.required = true;
  const renderOptions = (options) => {
    speciesSelect.replaceChildren();
    for (const opt of options) {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = `${opt.label} — ${tierLabel(opt.tier)}`;
      speciesSelect.append(o);
    }
  };
  renderOptions(defaultOptions);
  speciesField.append(speciesLbl, speciesSelect);

  // Disclosures
  const discloseRow = document.createElement('div');
  discloseRow.className = 'disclosure-row';
  const discloseSuitability = document.createElement('button');
  discloseSuitability.type = 'button';
  discloseSuitability.className = 'text-button disclose-suitability';
  discloseSuitability.textContent = 'Show lower suitability';
  const discloseInvasive = document.createElement('button');
  discloseInvasive.type = 'button';
  discloseInvasive.className = 'text-button disclose-invasive';
  discloseInvasive.textContent = 'Show invasive species';
  discloseRow.append(discloseSuitability, discloseInvasive);
  form.append(speciesField, discloseRow);

  // Tier / invasive warning paragraphs (shown when an off-default species is selected)
  const tierWarning = document.createElement('p');
  tierWarning.className = 'tier-warning';
  tierWarning.hidden = true;
  form.append(tierWarning);

  const invasiveAckRow = document.createElement('label');
  invasiveAckRow.className = 'invasive-ack';
  invasiveAckRow.hidden = true;
  const invasiveAck = document.createElement('input');
  invasiveAck.type = 'checkbox';
  invasiveAck.name = 'invasiveAck';
  const invasiveAckText = document.createElement('span');
  invasiveAckText.textContent = 'I understand this species can self-seed. I will manage dispersal.';
  invasiveAckRow.append(invasiveAck, invasiveAckText);
  form.append(invasiveAckRow);

  // Diameter
  const dbhField = field('plantedDbhCm', 'Trunk diameter at planting (cm)', (name) => {
    const input = document.createElement('input');
    input.type = 'number';
    input.name = name;
    input.min = '1'; input.max = '50'; input.step = '0.5'; input.value = '2';
    input.required = true;
    return input;
  });

  // Condition
  const condField = field('condition', 'Expected condition', (name) => {
    const select = document.createElement('select');
    select.name = name;
    for (const v of ['good', 'fair', 'poor']) {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v[0].toUpperCase() + v.slice(1);
      select.append(o);
    }
    return select;
  });

  form.append(dbhField, condField);

  const actions = document.createElement('div');
  actions.className = 'form-actions';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'primary-action';
  submit.textContent = 'Add to route';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'text-button cancel';
  cancel.textContent = 'Cancel';
  cancel.addEventListener('click', () => onCancel());
  actions.append(submit, cancel);
  form.append(actions);

  // Disclosure behavior
  discloseSuitability.addEventListener('click', () => {
    const extras = speciesOptions.filter(o => o.tier !== 'very' && !o.invasive && !o.trial);
    renderOptions([...defaultOptions, ...extras]);
    discloseSuitability.disabled = true;
  });
  discloseInvasive.addEventListener('click', () => {
    const invasives = speciesOptions.filter(o => o.invasive);
    renderOptions([...speciesSelect.querySelectorAll('option')].map(o => speciesOptions.find(s => s.value === o.value)).filter(Boolean).concat(invasives));
    discloseInvasive.disabled = true;
  });

  // Live re-evaluation of warnings & submit enabled
  const refreshGate = () => {
    const selected = speciesOptions.find(o => o.value === speciesSelect.value);
    if (!selected) {
      submit.disabled = false;
      tierWarning.hidden = true;
      invasiveAckRow.hidden = true;
      return;
    }
    if (selected.tier === 'marginal') {
      tierWarning.textContent = 'This species is in the Marginal tier — only suitable for moist sites under future climate.';
      tierWarning.hidden = false;
    } else if (selected.tier === 'suitable') {
      tierWarning.textContent = 'This species is in the Suitable tier — tolerates all but the driest sites under future climate.';
      tierWarning.hidden = false;
    } else {
      tierWarning.hidden = true;
    }
    if (selected.invasive) {
      invasiveAckRow.hidden = false;
      submit.disabled = !invasiveAck.checked;
    } else {
      invasiveAckRow.hidden = true;
      submit.disabled = false;
    }
  };
  speciesSelect.addEventListener('change', refreshGate);
  invasiveAck.addEventListener('change', refreshGate);
  refreshGate();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    onSubmit({
      speciesKey: speciesSelect.value,
      plantedDbhCm: Number(form.querySelector('input[name="plantedDbhCm"]').value),
      condition: form.querySelector('select[name="condition"]').value
    });
  });

  root.append(form);
}

function field(name, label, build) {
  const wrap = document.createElement('label');
  wrap.className = 'form-field';
  const lbl = document.createElement('span');
  lbl.textContent = label;
  wrap.append(lbl, build(name));
  return wrap;
}

function tierLabel(tier) {
  return tier === 'very' ? 'very suitable' : tier === 'suitable' ? 'suitable' : 'marginal';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test:unit -- tests/ui/planted-tree-form.test.js`
Expected: PASS for all 8 cases.

- [ ] **Step 5: Commit**

```bash
git add src/ui/planted-tree-form.js tests/ui/planted-tree-form.test.js
git commit -m "feat(ui): filter planted-tree form to Very Suitable species by default"
```

---

## Task 7: Planted Stop Type in Route Builder

**Files:**
- Modify: `src/ui/route-builder.js:3-5, 77-84`
- Test: `tests/route-builder.test.js`

**Interfaces:**
- Modifies: `addRouteStop(stops, stop)` — now accepts either a real `tree` (existing behavior) or a `plantedStop` (`{ planted: true, speciesKey, plantedDbhCm, condition, commonName }`). Keeps the same id-uniqueness rule by hashing the planted spec.
- `routeStop(tree)` (private) — add branch that handles planted stops.

- [ ] **Step 1: Add failing tests to `tests/route-builder.test.js`**

Append:

```js
import { addRouteStop } from '../src/ui/route-builder.js';

describe('planted stops', () => {
  it('accepts a planted stop with a generated id', () => {
    const planted = { planted: true, speciesKey: 'ACER_RUBRUM', plantedDbhCm: 5, condition: 'good', commonName: 'Red Maple' };
    const result = addRouteStop([], planted);
    expect(result).toHaveLength(1);
    expect(result[0].planted).toBe(true);
    expect(result[0].id).toMatch(/^planted-/);
  });

  it('deduplicates identical planted stops by their spec', () => {
    const a = { planted: true, speciesKey: 'ACER_RUBRUM', plantedDbhCm: 5, condition: 'good' };
    const b = { planted: true, speciesKey: 'ACER_RUBRUM', plantedDbhCm: 5, condition: 'good' };
    expect(addRouteStop(addRouteStop([], a), b)).toHaveLength(1);
  });

  it('keeps distinct planted stops separate', () => {
    const a = { planted: true, speciesKey: 'ACER_RUBRUM', plantedDbhCm: 5, condition: 'good' };
    const b = { planted: true, speciesKey: 'QUERCUS_GARRYANA', plantedDbhCm: 5, condition: 'good' };
    expect(addRouteStop(addRouteStop([], a), b)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test:unit -- tests/route-builder.test.js`
Expected: new tests FAIL (planted stops not handled).

- [ ] **Step 3: Modify `src/ui/route-builder.js`**

Replace `addRouteStop` and `routeStop`:

```js
export function addRouteStop(stops, tree) {
  const id = stopId(tree);
  if (stops.some(stop => stop.id === id)) return stops;
  return [...stops, routeStop(tree, id)];
}

function stopId(stopOrTree) {
  if (stopOrTree.planted) {
    return `planted-${stopOrTree.speciesKey}-${stopOrTree.plantedDbhCm}-${stopOrTree.condition ?? 'good'}`;
  }
  return stopOrTree.id;
}

function routeStop(input, idOverride) {
  if (input.planted) {
    return {
      id: idOverride,
      planted: true,
      commonName: input.commonName,
      speciesKey: input.speciesKey,
      plantedDbhCm: input.plantedDbhCm,
      condition: input.condition ?? 'good'
    };
  }
  return {
    id: input.id,
    commonName: input.commonName,
    latitude: input.latitude,
    longitude: input.longitude
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test:unit -- tests/route-builder.test.js`
Expected: all cases PASS (existing 2 + new 3).

- [ ] **Step 5: Commit**

```bash
git add src/ui/route-builder.js tests/route-builder.test.js
git commit -m "feat(route): accept planted-tree stops with stable spec-derived ids"
```

---

## Task 8: Projection Curve DOM Builder

**Files:**
- Create: `src/ui/benefit-curve.js`
- Test: `tests/ui/benefit-curve.test.js`

**Interfaces:**
- Produces: `createBenefitCurve(projection, { width = 280, height = 120 } = {}) -> HTMLElement`
  - `projection` = array of points from `projectionFor`.
  - Returns a `<figure class="benefit-curve">` with inline `<svg>` plotting cumulative CO₂ (kg) and cumulative stormwater (L) on dual y-axes.
  - Returns `<figure class="empty">Benefits unavailable</figure>` if `projection` is null/empty.
  - Renders accessible `<title>` and `<desc>` for screen readers.

- [ ] **Step 1: Write the failing test**

```js
// tests/ui/benefit-curve.test.js
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
global.document = dom.window.document;
import { createBenefitCurve } from '../../src/ui/benefit-curve.js';

const sample = Array.from({ length: 30 }, (_, i) => ({
  year: i + 1,
  dbhCm: 2 + i * 0.5,
  co2Kg: 1 + i * 0.3,
  stormwaterL: 10 + i * 5,
  cumulativeCo2Kg: (1 + i * 0.3) * (i + 1) / 2,
  cumulativeStormwaterL: (10 + i * 5) * (i + 1) / 2
}));

describe('createBenefitCurve', () => {
  it('returns an empty figure when projection is missing', () => {
    const fig = createBenefitCurve(null);
    expect(fig.classList.contains('empty')).toBe(true);
  });

  it('renders an svg with two polyline paths', () => {
    const fig = createBenefitCurve(sample);
    expect(fig.tagName).toBe('FIGURE');
    const svg = fig.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.querySelectorAll('polyline')).toHaveLength(2);
  });

  it('uses accessible title and desc', () => {
    const fig = createBenefitCurve(sample);
    expect(fig.querySelector('svg > title')).not.toBeNull();
    expect(fig.querySelector('svg > desc')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test:unit -- tests/ui/benefit-curve.test.js`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement the curve**

```js
// src/ui/benefit-curve.js
const PAD = { top: 8, right: 32, bottom: 16, left: 32 };

/**
 * @param {null | Array<{year:number, cumulativeCo2Kg:number, cumulativeStormwaterL:number}>} projection
 * @param {{width?:number, height?:number}} [opts]
 */
export function createBenefitCurve(projection, { width = 280, height = 120 } = {}) {
  const fig = document.createElement('figure');
  fig.className = 'benefit-curve';
  if (!projection || projection.length === 0) {
    fig.classList.add('empty');
    fig.textContent = 'Benefits unavailable';
    return fig;
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.textContent = 'Projected 30-year benefits';
  const desc = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
  const finalCo2 = projection.at(-1).cumulativeCo2Kg;
  const finalWater = projection.at(-1).cumulativeStormwaterL;
  desc.textContent = `After ${projection.length} years: ${Math.round(finalCo2)} kg CO2 sequestered, ${Math.round(finalWater).toLocaleString()} L stormwater intercepted.`;
  svg.append(title, desc);

  const maxCo2 = Math.max(...projection.map(p => p.cumulativeCo2Kg), 1);
  const maxWater = Math.max(...projection.map(p => p.cumulativeStormwaterL), 1);
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (i / (projection.length - 1)) * innerW;
  const yCo2 = (v) => PAD.top + innerH - (v / maxCo2) * innerH;
  const yWater = (v) => PAD.top + innerH - (v / maxWater) * innerH;

  const co2 = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  co2.setAttribute('class', 'curve-co2');
  co2.setAttribute('points', projection.map((p, i) => `${x(i)},${yCo2(p.cumulativeCo2Kg)}`).join(' '));
  const water = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  water.setAttribute('class', 'curve-water');
  water.setAttribute('points', projection.map((p, i) => `${x(i)},${yWater(p.cumulativeStormwaterL)}`).join(' '));
  svg.append(co2, water);

  const caption = document.createElement('figcaption');
  caption.textContent = `${Math.round(finalCo2)} kg CO₂ · ${Math.round(finalWater).toLocaleString()} L stormwater over ${projection.length} years`;
  fig.append(svg, caption);
  return fig;
}
```

- [ ] **Step 4: Add curve styles to `src/styles/benefits.css`**

```css
.benefit-curve { margin: 1rem 0; padding: 0.5rem; background: var(--surface-2, #f4f1ea); border-radius: 0.5rem; }
.benefit-curve.empty { padding: 1rem; color: var(--text-3, #6a6a6a); }
.benefit-curve svg { width: 100%; height: auto; display: block; }
.benefit-curve polyline.curve-co2 { fill: none; stroke: #2e7d32; stroke-width: 1.5; }
.benefit-curve polyline.curve-water { fill: none; stroke: #1565c0; stroke-width: 1.5; }
.benefit-curve figcaption { font-size: 0.8rem; color: var(--text-2, #4a4a4a); margin-top: 0.5rem; }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun test:unit -- tests/ui/benefit-curve.test.js`
Expected: PASS for all 3 cases.

- [ ] **Step 6: Commit**

```bash
git add src/ui/benefit-curve.js src/styles/benefits.css tests/ui/benefit-curve.test.js
git commit -m "feat(ui): add 30-year benefit projection curve"
```

---

## Task 9: Route Summary Projection Line

**Files:**
- Modify: `src/ui/route-summary.js`
- Test: `tests/route-summary.test.js` (new)

**Interfaces:**
- Modifies: `routeSummary(route)` — when `route.stops` contains at least one stop with `planted: true`, append `" · X planted trees projecting Y kg CO₂ over 30 years"` to the returned string.
- Produces: `routeProjectionSummary(route, projectionFor) -> string` — pure helper, takes the imported `projectionFor` for testability without circular imports.

- [ ] **Step 1: Write the failing test**

```js
// tests/route-summary.test.js
import { describe, expect, it } from 'vitest';
import { routeProjectionSummary } from '../src/ui/route-summary.js';
import { projectionFor } from '../src/domain/benefits.js';

const baseRoute = { stops: [], status: 'idle', distance: 0, duration: 0 };

describe('routeProjectionSummary', () => {
  it('returns empty string when no planted stops', () => {
    expect(routeProjectionSummary({ ...baseRoute, stops: [{ id: 'a' }] }, projectionFor)).toBe('');
  });

  it('reports the number of planted trees and projected CO2', () => {
    const route = {
      ...baseRoute,
      stops: [
        { id: 'a' },
        { planted: true, speciesKey: 'ACER_RUBRUM', plantedDbhCm: 5, condition: 'good' },
        { planted: true, speciesKey: 'THUJA_PLICATA', plantedDbhCm: 5, condition: 'good' }
      ]
    };
    const s = routeProjectionSummary(route, projectionFor);
    expect(s).toMatch(/2 planted trees/);
    expect(s).toMatch(/over 30 years/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test:unit -- tests/route-summary.test.js`
Expected: FAIL with "routeProjectionSummary is not a function"

- [ ] **Step 3: Modify `src/ui/route-summary.js`**

```js
export function routeSummary(route) {
  if (route.status === 'loading') return 'Calculating walking route';
  if (route.status === 'error') return 'Route could not be calculated';
  if (route.distance) return `${(route.distance / 1000).toFixed(1)} km, ${Math.round(route.duration / 60)} minutes walking`;
  if (route.stops.length === 1) return '1 stop saved. Add another tree to calculate a route.';
  return `${route.stops.length} stops`;
}

/**
 * Append-only projection line for routes containing planted stops.
 * @param {{stops:Array<{planted?:boolean, speciesKey?:string, plantedDbhCm?:number, condition?:string}>}} route
 * @param {(spec:{speciesKey:string, plantedDbhCm?:number, condition?:string}) => Array<{cumulativeCo2Kg:number}>} projectionForFn
 * @returns {string}
 */
export function routeProjectionSummary(route, projectionForFn) {
  const planted = route.stops.filter(s => s.planted && s.speciesKey);
  if (planted.length === 0) return '';
  const totalCo2 = planted.reduce((acc, s) => {
    const p = projectionForFn({ speciesKey: s.speciesKey, plantedDbhCm: s.plantedDbhCm, condition: s.condition });
    return acc + (p ? p.at(-1).cumulativeCo2Kg : 0);
  }, 0);
  return ` · ${planted.length} planted tree${planted.length === 1 ? '' : 's'} projecting ${Math.round(totalCo2)} kg CO₂ over 30 years`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test:unit -- tests/route-summary.test.js`
Expected: PASS for both cases.

- [ ] **Step 5: Commit**

```bash
git add src/ui/route-summary.js tests/route-summary.test.js
git commit -m "feat(route-summary): append projection line when route has planted stops"
```

---

## Task 10: App-Shell Wiring

**Files:**
- Modify: `src/ui/app-shell.js` (locate the "Add to route" / inspector rendering section)
- Modify: `src/main.js` (wire `onPlantTree` callback)

**Interfaces:**
- `app-shell.js` change: when rendering the inspector, also include a "Plant a tree instead" secondary button. On click, render `planted-tree-form` into a new section below the existing actions.
- `main.js` change: provide `onPlantTreeSubmit(stop)` that:
  1. Calls `state.addRouteStop(stop)` (the existing flow).
  2. Closes the form.
  3. Re-renders the route summary so the projection line appears.

- [ ] **Step 1: Read `app-shell.js` and `main.js` to find the exact insertion points**

Run: `cat src/ui/app-shell.js | head -60` and `cat src/main.js | head -60`
Confirm the spot where the inspector is rendered and where the route stop is added. Document the line numbers in the commit message.

- [ ] **Step 2: Add the "Plant a tree" button in `app-shell.js`**

After the `route` button (around the inspector `actions` block), append a `plant` button:

```js
const plant = document.createElement('button');
plant.type = 'button';
plant.className = 'secondary-action';
plant.textContent = 'Plant a tree here';
plant.addEventListener('click', onPlantTree);
actions.append(plant);
```

Modify the `renderTreeInspector` call site in `app-shell.js` to pass `onPlantTree` through to `renderTreeInspector`. Add a fourth parameter to `renderTreeInspector(tree, root, opts, { onPlantTree })` — or merge into existing opts, whichever matches the existing call signature.

- [ ] **Step 3: Render the form in `app-shell.js`**

When `onPlantTree` is invoked, mount `renderPlantedTreeForm(formContainer, { onSubmit, onCancel, speciesOptions, defaultOptions })`. Build the options as:
```js
import { ITREE_COEFFICIENTS } from '../data/itree-coefficients.js';
import { filterDefaultSpecies } from './planted-tree-form.js';
const speciesOptions = Object.entries(ITREE_COEFFICIENTS).map(([value, e]) => ({
  value, label: e.commonName, tier: e.climateTier, invasive: e.invasive, trial: e.trial
}));
const defaultOptions = filterDefaultSpecies(speciesOptions);
```
`onSubmit` calls into `main.js`'s handler; `onCancel` removes the form container.

- [ ] **Step 4: Wire `main.js`**

Add to the route-related imports in `main.js`:

```js
import { routeProjectionSummary } from './ui/route-summary.js';
```

Add a callback passed into the inspector flow:

```js
function handlePlantTreeSubmit(stop) {
  state.addRouteStop(stop);
  // re-render the route summary line:
  const summaryEl = document.querySelector('.route-summary');
  if (summaryEl) summaryEl.textContent = routeSummary(currentRoute()) + routeProjectionSummary(currentRoute(), projectionFor);
}
```

Where `currentRoute()` returns the current route state (read existing `src/state.js` to confirm the accessor — likely `state.getRoute()` or similar). Match the existing pattern; do not invent a new state shape.

- [ ] **Step 5: Manual verification**

Run: `bun run dev`
Expected:
1. Open the app, click a tree. Inspector now shows 4 benefit tiles.
2. Click "Plant a tree here". Form appears. Pick Red Maple, diameter 5, condition good. Submit.
3. Route summary line now reads e.g. `"1 stop saved. Add another tree to calculate a route. · 1 planted tree projecting X kg CO₂ over 30 years"`.

- [ ] **Step 6: Run full unit test suite + type check**

Run: `bun run check && bun test:unit`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/ui/app-shell.js src/main.js
git commit -m "feat(app): wire planted-tree form into inspector and route summary"
```

---

## Task 11: E2E Regression for Visual Snapshot

**Files:**
- Modify: `tests/e2e/visual.spec.js`

**Interfaces:**
- Adds one Playwright test that opens the app, clicks a tree known to have `ACER_RUBRUM` species with a recorded diameter, and captures a full-page screenshot at desktop width.

- [ ] **Step 1: Add the test**

Append to `tests/e2e/visual.spec.js`:

```js
test('inspector shows annual benefit card', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  // Wait for the first curated tree with ACER_RUBRUM species; click it.
  const treeButton = page.locator('button:has-text("Red Maple")').first();
  await treeButton.waitFor({ state: 'visible' });
  await treeButton.click();
  await expect(page.locator('.benefit-card')).toBeVisible();
  await expect(page.locator('.benefit-tile')).toHaveCount(4);
  await page.screenshot({ path: 'tests/e2e/visual.spec.js-snapshots/inspector-with-benefits-chromium-darwin.png', fullPage: true });
});
```

- [ ] **Step 2: Run the test, observe the new snapshot**

Run: `bun run test:e2e -- tests/e2e/visual.spec.js`
Expected: 1 new test PASS, a new PNG lands in the snapshots directory. Existing snapshots untouched (the inspector change only adds a new section below the existing facts section; if a previous `desktop-selected-tree` snapshot regresses, regenerate with `--update-snapshots` and **review the diff** before accepting).

- [ ] **Step 3: If existing snapshots regress, regenerate + manual review**

Run: `bunx playwright test tests/e2e/visual.spec.js --project=chromium --update-snapshots`
Manually open the regenerated PNGs and confirm only the new benefit card area changed.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/visual.spec.js tests/e2e/visual.spec.js-snapshots/inspector-with-benefits-chromium-darwin.png
git commit -m "test(e2e): add visual regression for inspector benefit card"
```

---

## Self-Review

**1. Spec coverage:**

| Tier 1 item | Task |
|---|---|
| 1. Per-tree benefit estimate in inspector (4 tiles) | Tasks 1, 2, 4, 5 |
| 2. "Plant this tree" benefit forecast in route-builder (30-yr curve) | Tasks 3, 6, 7, 8, 9, 10 |
| 3. Priority planting overlay (hex tint) | **Out of scope for this plan.** This was Tier 1 item 3 in the recommendation, but the user asked for an implementation plan for the i-Tree features (per-tree + planted). Priority overlay is independent and should be a separate plan. Flagging here so it's not silently dropped. |
| Climate-tier badge in benefit card | Tasks 1, 4, 5 |
| Invasive/trial species warning in planted-tree form | Tasks 1, 6, 10 |
| Metro Vancouver data pipeline (PDF → JSON) | Task 1 steps 1–2 |

**2. Placeholder scan:** No "TBD" / "implement later" / vague "handle edge cases" found. Every code step has the actual code.

**3. Type consistency:**

- `speciesKey` — string `"GENUS_SPECIES"` (uppercase). Consistent in Tasks 1, 2, 3, 6, 7, 8, 9, 10.
- `annualBenefitsFor` returns `{ co2Kg, co2StoredKg, stormwaterL, pollutantsG, energyCad, source }` — consistent between Tasks 2, 4, 5.
- `projectionFor` returns `Array<{ year, dbhCm, co2Kg, stormwaterL, cumulativeCo2Kg, cumulativeStormwaterL }>` — consistent between Tasks 3, 8, 9.
- `createBenefitCard(benefits, climateMeta)` — two-arg signature consistent across Tasks 4 and 5.
- `renderPlantedTreeForm(root, { onSubmit, onCancel, speciesOptions, defaultOptions })` — consistent between Tasks 6 and 10.
- `addRouteStop` shape — Tasks 7 and 10 use `{ id, planted?, commonName, speciesKey?, plantedDbhCm?, condition? }` consistently.
- `ITREE_COEFFICIENTS` — single export from Task 1, imported in Tasks 2, 3, 4, 5, 6, 9, 10.
- `climateTier: 'very'|'suitable'|'marginal'`, `invasive: boolean`, `trial: boolean` — consistent across Tasks 1, 4, 5, 6, 10.

**4. Risk flags:**

- Task 1 step 5 (the merge) requires running a Node one-shot. The plan documents the script (`scripts/import-metro-species.js`) and the intermediate file (`src/data/itree-species-tier.json`). The merged `ITREE_COEFFICIENTS.js` must be hand-written or generated; the plan covers both paths.
- Task 10 step 4 assumes an existing `state.addRouteStop` action and a route accessor. The implementer must read `src/state.js` before editing `main.js`; the plan tells them to. If the actual API differs, this step needs a small adjustment — but the tests in Task 7 don't depend on it, so failure is contained to Task 10.
- Task 11 may regenerate existing e2e snapshots because the inspector now shows additional content (climate badge). The plan documents that step and requires manual diff review before acceptance.
- **Use-category dimension (PRK/IR/HSG) is out of scope.** The PDF's color-separation codes are not visible in the text extract and may map to a printed-poster legend we don't have. If the user later finds the legend, a follow-up task can add a third filter dimension to the planted-tree form.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-11-itree-tier1-benefits.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**One real prerequisite before execution starts:** the `scripts/seed/metro-trees.txt` file must exist on disk (the plan tells the implementer to run `pdftotext` on the URL, but that fails outside this session). I'll generate it now via the Bash tool and commit it as a setup step before any task begins. The seed text I already extracted to `/tmp/metro_trees.txt` is the right input.

Which approach?
