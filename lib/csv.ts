/**
 * Build a CSV in memory and hand it to the browser as a download. No escaping
 * beyond the prototype's — the columns are names, numbers and percentages,
 * none of which carry commas in this dataset.
 */
export function downloadCsv(
  naranFile: string,
  kabesalyu: readonly string[],
  linha: readonly (readonly (string | number)[])[],
): void {
  const texto =
    `${kabesalyu.join(",")}\n${linha.map((l) => l.join(",")).join("\n")}`;
  const blob = new Blob([texto], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = naranFile;
  a.click();
  URL.revokeObjectURL(url);
}
