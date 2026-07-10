/**
 * Exports rendered mermaid diagrams as standalone SVG or PNG images.
 */

const pngScale = 2;

interface SvgExport {
  readonly source: string;
  readonly width: number;
  readonly height: number;
}

/**
 * Serializes the rendered SVG into a standalone SVG document.
 *
 * The in-preview SVG relies on the webview's environment (CSS variables, responsive sizing),
 * so the clone gets explicit dimensions and resolved variable values.
 */
function serializeSvg(svg: SVGSVGElement): SvgExport {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  const width = viewBox?.width || rect.width;
  const height = viewBox?.height || rect.height;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.style.maxWidth = "";

  let source = new XMLSerializer().serializeToString(clone);
  source = resolveCssVariables(source, svg);

  return { source, width, height };
}

/**
 * Replaces `var(--name, fallback)` references with their computed values so the
 * exported image looks the same outside of the webview.
 */
function resolveCssVariables(source: string, context: Element): string {
  const computed = window.getComputedStyle(context);
  return source.replace(
    /var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/g,
    (match, name: string, fallback: string | undefined) => {
      const value = computed.getPropertyValue(name).trim();
      return value || fallback?.trim() || match;
    },
  );
}

function downloadFile(href: string, filename: string): void {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function exportDiagramAsSvg(
  svg: SVGSVGElement,
  baseFilename: string,
): void {
  const { source } = serializeSvg(svg);
  const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  downloadFile(href, `${baseFilename}.svg`);
}

export async function exportDiagramAsPng(
  svg: SVGSVGElement,
  baseFilename: string,
): Promise<void> {
  const { source, width, height } = serializeSvg(svg);

  const image = new Image();
  image.decoding = "sync";
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () =>
      reject(new Error("Failed to load SVG for PNG export"));
  });
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  await loaded;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * pngScale));
  canvas.height = Math.max(1, Math.round(height * pngScale));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create canvas context for PNG export");
  }

  // Use the preview's background so themed (e.g. dark mode) diagrams stay readable
  const background = window.getComputedStyle(document.body).backgroundColor;
  if (background && background !== "rgba(0, 0, 0, 0)") {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  downloadFile(canvas.toDataURL("image/png"), `${baseFilename}.png`);
}
