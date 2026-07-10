/**
 * toCsv
 * Minimal, dependency-free CSV serializer. Escapes any field containing
 * a comma, quote, or newline by wrapping it in quotes and doubling
 * internal quotes — the standard RFC 4180 approach — so exported names
 * or notes with commas don't silently corrupt the file.
 */
function escapeCell(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows, columns) {
  const header = columns.map(escapeCell).join(",");
  const body = rows
    .map((row) => columns.map((col) => escapeCell(row[col])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

module.exports = { toCsv };
