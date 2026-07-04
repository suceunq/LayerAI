import type { UpdateManagerApi } from "./api.js";

declare global {
  interface Window {
    api: UpdateManagerApi;
  }
}
