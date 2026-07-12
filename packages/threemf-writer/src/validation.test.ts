import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { validateMeshGeometry, validateStandaloneBambuJsonText, validateStandaloneIniText, validateThreeMf } from "./validation.js";
import { buildThreeMf } from "./writer.js";
import { buildStandaloneBambuJsonText, buildStandaloneIniText } from "./config-writer.js";
import type { FilamentProfile, PrinterProfile } from "@layerai/shared-types";

const printer: PrinterProfile = {
  id: "test-printer", name: "Imprimante test", vendor: "Prusa Research", family: "test", technology: "FFF",
  bedShape: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }, { x: 0, y: 200 }],
  maxPrintHeightMm: 200, nozzleDiametersMm: [0.4], defaultNozzleDiameterMm: 0.4, hasMmu: false, isInputShaper: false,
};
const filament: FilamentProfile = {
  id: "PLA", name: "PLA test", materialType: "PLA", densityGCm3: 1.24, diameterMm: 1.75,
  defaultNozzleTempC: 210, defaultFirstLayerNozzleTempC: 215, defaultBedTempC: 60, defaultFirstLayerBedTempC: 65,
  isFlexible: false, isAbrasive: false,
};

test("accepte un triangle indexé valide", () => {
  assert.doesNotThrow(() => validateMeshGeometry({ positions: [0, 0, 0, 10, 0, 0, 0, 10, 0], indices: [0, 1, 2] }));
});

test("refuse les coordonnées non finies et les indices hors limites", () => {
  assert.throws(() => validateMeshGeometry({ positions: [0, 0, Number.NaN] }), /non finie/);
  assert.throws(() => validateMeshGeometry({ positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 9] }), /inexistant/);
});

test("valide les profils INI et JSON complets", () => {
  assert.doesNotThrow(() => validateStandaloneIniText("printer_model = p\nnozzle_diameter = 0.4\nfilament_type = PLA\n"));
  assert.doesNotThrow(() => validateStandaloneBambuJsonText(JSON.stringify({ type: "process", name: "LayerAI", from: "User", printer_model: "p", nozzle_diameter: "0.4", filament_type: "PLA" })));
});

test("exporte le placement et le style des supports dans chaque famille de slicer", () => {
  const config = {
    support_material: { value: true, confidence: 1, ruleId: "test" },
    support_material_buildplate_only: { value: true, confidence: 1, ruleId: "test" },
    support_material_style: { value: "organic", confidence: 1, ruleId: "test" },
  };
  const ini = buildStandaloneIniText(config, printer, filament);
  assert.match(ini, /support_material_buildplate_only = 1/);
  assert.match(ini, /support_material_style = organic/);
  const bambu = JSON.parse(buildStandaloneBambuJsonText(config, { ...printer, vendor: "Bambu Lab" }, filament));
  assert.equal(bambu.support_on_build_plate_only, "1");
  assert.equal(bambu.support_type, "tree(auto)");
});

test("refuse de produire silencieusement un profil Bambu incomplet", () => {
  const config = { future_unmapped_setting: { value: 1, confidence: 1, ruleId: "test" } };
  assert.throws(() => buildStandaloneBambuJsonText(config, { ...printer, vendor: "Bambu Lab" }, filament), /incomplet/);
});

test("refuse les profils incomplets ou mal formés", () => {
  assert.throws(() => validateStandaloneIniText("printer_model: p"), /format/);
  assert.throws(() => validateStandaloneBambuJsonText("{"), /illisible/);
  assert.throws(() => validateStandaloneBambuJsonText(JSON.stringify({ type: "process" })), /manquant/);
});

test("refuse une archive 3MF privée de ses composants obligatoires", async () => {
  const zip = new JSZip();
  zip.file("dummy.txt", "vide");
  const bytes = await zip.generateAsync({ type: "uint8array" });
  await assert.rejects(() => validateThreeMf(bytes), /fichier obligatoire manquant/);
});

test("génère puis relit un projet 3MF complet", async () => {
  const bytes = await buildThreeMf({
    geometry: { positions: [0, 0, 0, 10, 0, 0, 0, 10, 0], indices: [0, 1, 2] },
    config: { layer_height: { value: 0.2, confidence: 1, ruleId: "test" } },
    printer,
    filament,
    objectName: "triangle de référence",
  });
  assert.ok(bytes.byteLength > 100);
  await assert.doesNotReject(() => validateThreeMf(bytes));
});
