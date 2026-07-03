# Third-party data: PrusaSlicer configuration bundle

LayerAI seeds its printer and filament database from Prusa Research's
official PrusaSlicer vendor configuration file, `PrusaResearch.ini`
(part of the [PrusaSlicer](https://github.com/prusa3d/PrusaSlicer)
repository, licensed AGPL-3.0-or-later).

## What is taken from the source file

- `packages/prusa-profile-db/data/printers.json` — printer model
  identity, build plate shape/size, max print height, and nozzle
  options, resolved from `[printer_model:*]` and `[printer:*]` sections.
- `packages/prusa-profile-db/data/filaments.json` — a curated subset of
  base material defaults (temperatures, density, cost) resolved from a
  representative `[filament:*]` section per material (see
  `tooling/profile-ingest/src/curator.ts` for the exact source section
  names used).
- `packages/prusa-profile-db/data/presets.json` — per-printer layer
  height bounds, resolved from the same printer sections.

The source `.ini` file itself is never copied into this repository. The
ingest tool (`tooling/profile-ingest`) reads it directly from a sibling
PrusaSlicer checkout at build time and regenerates the JSON above.

## What is authored by LayerAI

- Carbon-fiber filament variants (`PLA-CF`, `PETG-CF`, `PA-CF`) are
  heuristic derivations (temperature deltas + abrasive-nozzle flag) over
  their base material, not sourced from a single vendor profile section.
- All mesh-analysis, intent-parsing, parameter-generation, and
  explanation logic is original LayerAI code and does not reuse
  PrusaSlicer source code.

## License compliance

- `docs/licensing/NOTICE` credits Prusa Research and cites the AGPLv3
  license and source location.
- The curated JSON data is regenerable at any time from a PrusaSlicer
  checkout via `pnpm run ingest:profiles`; it is not treated as original
  LayerAI intellectual property.
