import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parsePayPalDonationUrl } from "./donation-url.js";

test("accepte uniquement les pages de paiement officielles PayPal en HTTPS", () => {
  assert.equal(
    parsePayPalDonationUrl("https://www.paypal.com/donate/?hosted_button_id=ABC123"),
    "https://www.paypal.com/donate/?hosted_button_id=ABC123",
  );
  assert.equal(parsePayPalDonationUrl("https://paypal.me/layerai"), "https://paypal.me/layerai");
  assert.equal(parsePayPalDonationUrl("https://www.paypal.com/ncp/payment/ABC123"), "https://www.paypal.com/ncp/payment/ABC123");
});

test("refuse les liens non chiffrés, les faux domaines et les pages non destinées au paiement", () => {
  assert.equal(parsePayPalDonationUrl("http://paypal.me/layerai"), null);
  assert.equal(parsePayPalDonationUrl("https://paypal.example/donate"), null);
  assert.equal(parsePayPalDonationUrl("https://paypal.com.example/donate"), null);
  assert.equal(parsePayPalDonationUrl("https://www.paypal.com/signin"), null);
  assert.equal(parsePayPalDonationUrl("not-a-url"), null);
});

test("la configuration distribuée contient une page de don PayPal valide", async () => {
  const configPath = path.resolve(import.meta.dirname, "../../../resources/donation.json");
  const config = JSON.parse(await readFile(configPath, "utf8")) as { paypalUrl?: string };
  const url = parsePayPalDonationUrl(config.paypalUrl ?? "");
  assert.ok(url);
  assert.equal(new URL(url).searchParams.get("business"), "X65TNHGN5K7QA");
});
