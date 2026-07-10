import MarkdownIt from "markdown-it";
import * as vscode from "vscode";
import { extendMarkdownItWithMermaid } from "../shared-md-mermaid";
import { configSection, injectMermaidConfig } from "./config";

const previewViewType = "markdown-mermaid-plus.preview";
const markdownLanguageId = "markdown";

/**
 * Registers the dedicated Mermaid markdown preview.
 *
 * Unlike contributing into VS Code's built-in markdown preview (which now ships its own Mermaid
 * renderer and would conflict), this opens a self-contained webview that we fully control. It
 * reuses the same webview render bundle (`dist-preview`) as the built-in-preview integration did.
 */
export function registerMermaidPreview(
  context: vscode.ExtensionContext,
): vscode.Disposable {
  const manager = new MermaidPreviewManager(context);
  return vscode.Disposable.from(
    vscode.commands.registerCommand("markdown-mermaid-plus.openPreview", () =>
      manager.showPreview(vscode.ViewColumn.Active),
    ),
    vscode.commands.registerCommand(
      "markdown-mermaid-plus.openPreviewToSide",
      () => manager.showPreview(vscode.ViewColumn.Beside),
    ),
    manager,
  );
}

class MermaidPreviewManager implements vscode.Disposable {
  private readonly md: MarkdownIt;
  private readonly previews: MermaidPreview[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {
    this.md = new MarkdownIt({ html: true, linkify: true, typographer: true });
    extendMarkdownItWithMermaid(this.md, {
      languageIds: () =>
        vscode.workspace
          .getConfiguration(configSection)
          .get<string[]>("languages", ["mermaid"]),
    });
    this.md.use(injectMermaidConfig);
  }

  public showPreview(column: vscode.ViewColumn): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== markdownLanguageId) {
      vscode.window.showInformationMessage(
        "Open a Markdown file to show the Mermaid preview.",
      );
      return;
    }

    const document = editor.document;

    // Reuse an existing preview for this document if there is one
    const existing = this.previews.find(
      (p) => p.documentUri.toString() === document.uri.toString(),
    );
    if (existing) {
      existing.reveal(column);
      return;
    }

    const preview = MermaidPreview.create(
      this.context,
      this.md,
      document,
      column,
    );
    this.previews.push(preview);
    preview.onDidDispose(() => {
      const index = this.previews.indexOf(preview);
      if (index >= 0) {
        this.previews.splice(index, 1);
      }
    });
  }

  public dispose(): void {
    for (const preview of [...this.previews]) {
      preview.dispose();
    }
  }
}

class MermaidPreview {
  private readonly disposables: vscode.Disposable[] = [];
  private readonly onDidDisposeEmitter = new vscode.EventEmitter<void>();
  public readonly onDidDispose = this.onDidDisposeEmitter.event;

  private updateTimer: ReturnType<typeof setTimeout> | undefined;

  public static create(
    context: vscode.ExtensionContext,
    md: MarkdownIt,
    document: vscode.TextDocument,
    column: vscode.ViewColumn,
  ): MermaidPreview {
    const panel = vscode.window.createWebviewPanel(
      previewViewType,
      MermaidPreview.titleFor(document),
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, "dist-preview"),
        ],
      },
    );
    return new MermaidPreview(context, md, document, panel);
  }

  private constructor(
    context: vscode.ExtensionContext,
    private readonly md: MarkdownIt,
    private readonly document: vscode.TextDocument,
    private readonly panel: vscode.WebviewPanel,
  ) {
    const bundleUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(
        context.extensionUri,
        "dist-preview",
        "index.bundle.js",
      ),
    );
    panel.webview.html = this.buildHtml(panel.webview, bundleUri);

    panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Re-render when the source document changes
    vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === this.document.uri.toString()) {
          this.scheduleUpdate();
        }
      },
      null,
      this.disposables,
    );

    // Re-render when the document is closed/reopened is out of scope; keep the last content.

    // Re-render on theme or config changes so the Mermaid theme stays in sync
    vscode.window.onDidChangeActiveColorTheme(
      () => this.update(),
      null,
      this.disposables,
    );
    vscode.workspace.onDidChangeConfiguration(
      (e) => {
        if (e.affectsConfiguration(configSection)) {
          this.update();
        }
      },
      null,
      this.disposables,
    );
  }

  public get documentUri(): vscode.Uri {
    return this.document.uri;
  }

  public reveal(column: vscode.ViewColumn): void {
    this.panel.reveal(column);
  }

  public dispose(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = undefined;
    }
    this.onDidDisposeEmitter.fire();
    this.onDidDisposeEmitter.dispose();
    this.panel.dispose();
    for (const d of this.disposables.splice(0)) {
      d.dispose();
    }
  }

  private scheduleUpdate(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    this.updateTimer = setTimeout(() => {
      this.updateTimer = undefined;
      this.update();
    }, 100);
  }

  private update(): void {
    const html = this.md.render(this.document.getText());
    void this.panel.webview.postMessage({ type: "update", html });
  }

  private buildHtml(webview: vscode.Webview, bundleUri: vscode.Uri): string {
    const nonce = getNonce();
    const contentHtml = this.md.render(this.document.getText());
    const csp = [
      `default-src 'none'`,
      `img-src ${webview.cspSource} data: https:`,
      `script-src 'nonce-${nonce}'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource} data:`,
    ].join("; ");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mermaid Preview</title>
    <style>
        body {
            padding: 0 16px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
        }
    </style>
</head>
<body>
    <div id="mmp-content">${contentHtml}</div>
    <script nonce="${nonce}">
        window.addEventListener('message', event => {
            const message = event.data;
            if (message && message.type === 'update') {
                const el = document.getElementById('mmp-content');
                if (el) {
                    el.innerHTML = message.html;
                }
                // Reuse the bundle's re-render path (preserves per-diagram pan/zoom state by id)
                window.dispatchEvent(new Event('vscode.markdown.updateContent'));
            }
        });
    </script>
    <script nonce="${nonce}" src="${bundleUri}"></script>
</body>
</html>`;
  }

  private static titleFor(document: vscode.TextDocument): string {
    const name = document.uri.path.split("/").pop() || "Markdown";
    return `Preview ${name}`;
  }
}

function getNonce(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
