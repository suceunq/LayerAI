import type { LayerAiApi } from "./api.js";

declare global {
  interface Window {
    api: LayerAiApi;
  }
}
