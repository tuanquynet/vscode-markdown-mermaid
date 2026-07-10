import * as vscode from "vscode";
import { registerMermaidPreview } from "./preview";

export function activate(ctx: vscode.ExtensionContext) {
  // This extension no longer contributes into VS Code's built-in markdown preview, which now ships
  // its own Mermaid renderer and would conflict. Instead it provides a dedicated preview that we
  // fully own, opened via the `Markdown Mermaid Plus: Open Preview` commands.
  ctx.subscriptions.push(registerMermaidPreview(ctx));
}
