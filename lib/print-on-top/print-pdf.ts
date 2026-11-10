/**
 * Opens the browser's native print dialog for a PDF, mirroring oboda-app's
 * `print-on-top-templates/_utils/print.ts`: the PDF is loaded into an
 * invisible iframe and that iframe's window is printed.
 */
export function printPdf(bytes: Uint8Array): void {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");

  // visibility:hidden (not display:none) keeps the iframe in the layout tree
  // so Chromium on Windows renders the PDF before the print dialog opens.
  Object.assign(iframe.style, {
    visibility: "hidden",
    position: "fixed",
    top: "0",
    left: "0",
    width: "0",
    height: "0",
  });
  iframe.src = url;

  iframe.onload = () => {
    setTimeout(() => {
      iframe.focus();
      iframe.contentWindow?.print();
      // The editor window regains focus once the print dialog closes.
      window.addEventListener(
        "focus",
        () => {
          iframe.remove();
          URL.revokeObjectURL(url);
        },
        { once: true }
      );
    }, 500);
  };

  document.body.appendChild(iframe);
}
