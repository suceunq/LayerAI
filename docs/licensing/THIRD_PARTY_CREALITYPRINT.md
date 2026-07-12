# Third-party data: CrealityPrint configuration bundle

LayerAI seeds its Creality printer and filament database from Creality's
official CrealityPrint vendor configuration files under
`resources/profiles/Creality/{machine,filament}` (part of the
[CrealityPrint](https://github.com/CrealityOfficial/CrealityPrint)
repository, licensed AGPL-3.0-or-later - same license as PrusaSlicer and
BambuStudio, all three being part of the same OrcaSlicer-derived family).

## What is taken from the source files

- `packages/prusa-profile-db/data/printers.json` (entries with
  `vendor: "Creality"`) - printer model identity, build plate shape/size
  (`printable_area`), max print height (`printable_height`), and nozzle
  options, resolved from `Creality/machine/*.json` profiles
  (`type: "machine"` and `type: "machine_model"`).
- `packages/prusa-profile-db/data/filaments.json` (entries prefixed
  `CREALITY_`) - a curated subset of base material defaults (temperatures,
  density, cost), resolved from one representative
  `@Creality K2 Plus` filament profile per material family (see
  `tooling/profile-ingest/src/creality/curator.ts` for the exact source
  section names used).

The source JSON files are never copied into this repository. The ingest
tool (`tooling/profile-ingest`) reads them directly from a sibling
CrealityPrint checkout at build time and regenerates the JSON above
alongside the Prusa and Bambu data.

## What is authored by LayerAI

- Exporting print parameters for a Creality-selected printer reuses the
  same Bambu-style parameter vocabulary translation (`Metadata/print_profile.config`
  in the exported `.3mf`), since CrealityPrint's engine reads that format
  natively (confirmed in `src/libslic3r/Format/bbs_3mf.cpp`, the active
  3mf reader/writer in the CrealityPrint source tree).
- All mesh-analysis, intent-parsing, parameter-generation, and
  explanation logic is original LayerAI code and does not reuse
  CrealityPrint source code.

## License compliance

- `docs/licensing/NOTICE` credits Prusa Research, Bambu Lab, and Creality,
  and cites the AGPLv3 license and source locations.
- The curated JSON data is regenerable at any time from a CrealityPrint
  checkout via `pnpm run ingest:profiles`; it is not treated as original
  LayerAI intellectual property.
