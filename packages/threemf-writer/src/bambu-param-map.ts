/**
 * Maps LayerAI's internal parameter vocabulary (PrusaSlicer key names, since config-generator's
 * rules are authored once against that vocabulary) to BambuStudio's own parameter names, for
 * projects targeting a Bambu Lab printer. Verified against BambuStudio's PrintConfig.cpp option
 * definitions (grep-confirmed field names), but NOT round-trip tested against a real BambuStudio
 * install (unlike the PrusaSlicer path) - no BambuStudio was available in this environment to
 * verify. Treat exported Bambu projects as best-effort until confirmed by opening one for real.
 */
export const BAMBU_PARAM_MAP: Record<string, string> = {
  perimeters: "wall_loops",
  top_solid_layers: "top_shell_layers",
  bottom_solid_layers: "bottom_shell_layers",
  fill_density: "sparse_infill_density",
  fill_pattern: "sparse_infill_pattern",
  perimeter_speed: "outer_wall_speed",
  infill_speed: "sparse_infill_speed",
  travel_speed: "travel_speed",
  bridge_speed: "bridge_speed",
  default_acceleration: "default_acceleration",
  temperature: "nozzle_temperature",
  first_layer_temperature: "nozzle_temperature_initial_layer",
  bed_temperature: "cool_plate_temp",
  first_layer_bed_temperature: "cool_plate_temp_initial_layer",
  min_fan_speed: "fan_min_speed",
  max_fan_speed: "fan_max_speed",
  support_material: "enable_support",
  brim_width: "brim_width",
  skirts: "skirt_loops",
  raft_layers: "raft_layers",
  layer_height: "layer_height",
};

/** Keys with no confirmed direct BambuStudio equivalent (e.g. support_material_style's enum values differ) - dropped rather than guessed. */
export const BAMBU_UNMAPPED_KEYS = new Set(["support_material_style"]);
