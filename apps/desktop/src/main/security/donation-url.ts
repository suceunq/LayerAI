export function parsePayPalDonationUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.username || url.password) return null;
  const hostname = url.hostname.toLowerCase();
  const isPayPalMe = hostname === "paypal.me" || hostname === "www.paypal.me";
  const isPayPal = hostname === "paypal.com" || hostname.endsWith(".paypal.com");
  const path = url.pathname.toLowerCase();
  const isPaymentPath = path.includes("/donate") || path.includes("/paypalme/") || path.includes("/ncp/payment/");
  if ((!isPayPalMe && !isPayPal) || (isPayPalMe ? path === "/" : !isPaymentPath)) return null;
  return url.toString();
}
