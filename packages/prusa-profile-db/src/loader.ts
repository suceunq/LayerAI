import type { PrinterProfile } from "@layerai/shared-types";
import type { FilamentProfile } from "@layerai/shared-types";
import type { ProfileDbMeta, PrinterLayerHeightRange } from "./schema.js";

import printersData from "../data/printers.json" with { type: "json" };
import filamentsData from "../data/filaments.json" with { type: "json" };
import presetsData from "../data/presets.json" with { type: "json" };
import metaData from "../data/meta.json" with { type: "json" };

export const printers = printersData as unknown as PrinterProfile[];
export const filaments = filamentsData as unknown as FilamentProfile[];
export const presets = presetsData as unknown as PrinterLayerHeightRange[];
export const meta = metaData as unknown as ProfileDbMeta;
