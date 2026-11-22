export function csvDocument(rows: (string | number)[][]) {
  const cell = (value: string | number) => {
    const text = typeof value === "string" && /^[\s]*[=+\-@]/.test(value) ? "'" + value : String(value);
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return "\ufeff" + rows.map(row => row.map(cell).join(";")).join("\r\n");
}
