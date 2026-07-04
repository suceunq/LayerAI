function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Minimal Markdown -> HTML for changelog previews: headers, bold/italic, and bullet lists only.
 * Escapes HTML first so raw input can never inject markup - this is a local trusted admin tool, but
 * the changelog text still ends up rendered via dangerouslySetInnerHTML, so it stays defense-in-depth.
 */
export function renderMarkdownPreview(markdown: string): string {
  const lines = escapeHtml(markdown).split("\n");
  const htmlLines: string[] = [];
  let inList = false;

  for (const line of lines) {
    const headerMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    const listMatch = /^[-*]\s+(.*)$/.exec(line);

    if (listMatch) {
      if (!inList) {
        htmlLines.push("<ul>");
        inList = true;
      }
      htmlLines.push(`<li>${inlineFormat(listMatch[1] ?? "")}</li>`);
      continue;
    }
    if (inList) {
      htmlLines.push("</ul>");
      inList = false;
    }

    if (headerMatch) {
      const level = headerMatch[1]!.length;
      htmlLines.push(`<h${level}>${inlineFormat(headerMatch[2] ?? "")}</h${level}>`);
    } else if (line.trim() === "") {
      htmlLines.push("<br/>");
    } else {
      htmlLines.push(`<p>${inlineFormat(line)}</p>`);
    }
  }
  if (inList) htmlLines.push("</ul>");

  return htmlLines.join("\n");
}

function inlineFormat(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
}
