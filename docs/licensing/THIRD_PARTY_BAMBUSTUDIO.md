# Third-party data: BambuStudio configuration bundle

LayerAI seeds its Bambu Lab printer and filament database from Bambu Lab's
official BambuStudio vendor configuration files under
`resources/profiles/BBL/{machine,filament,process}` (part of the
[BambuStudio](https://github.com/bambulab/BambuStudio) repository,
licensed AGPL-3.0-or-later - same license as PrusaSlicer).

## What is taken from the source files

- `packages/prusa-profile-db/data/printers.json` (entries with
  `vendor: "Bambu Lab"`) - printer model identity, build plate shape/size
  (`printable_area`), max print height (`printable_height`), and nozzle
  options, resolved from `BBL/machine/*.json` profiles (`type: "machine"`
  and `type: "machine_model"`), plus the official bed texture SVG
  referenced by each printer model.
- `packages/prusa-profile-db/data/filaments.json` (entries prefixed
  `BAMBU_`) - a curated subset of base material defaults (temperatures,
  density, cost), resolved from one representative `@BBL X1C` filament
  profile per material family (see
  `tooling/profile-ingest/src/bambu/curator.ts` for the exact source
  section names used).

The source JSON files are never copied into this repository. The ingest
tool (`tooling/profile-ingest`) reads them directly from a sibling
BambuStudio checkout at build time and regenerates the JSON above
alongside the Prusa data.

## What is authored by LayerAI

- Exporting print parameters for a Bambu-selected printer translates
  LayerAI's own generated parameter set into BambuStudio's parameter
  vocabulary (e.g. `perimeters` -> `wall_loops`) via a hand-authored
  mapping table, not sourced from BambuStudio code.
- All mesh-analysis, intent-parsing, parameter-generation, and
  explanation logic is original LayerAI code and does not reuse
  BambuStudio source code.

## License compliance

- `docs/licensing/NOTICE` credits both Prusa Research and Bambu Lab and
  cites the AGPLv3 license and source locations.
- The curated JSON data is regenerable at any time from a BambuStudio
  checkout via `pnpm run ingest:profiles`; it is not treated as original
  LayerAI intellectual property.
