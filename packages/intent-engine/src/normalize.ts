/** Lowercases, strips diacritics, and collapses whitespace so accented/unaccented input match the same patterns. */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
