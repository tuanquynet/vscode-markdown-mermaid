# Markdown Preview Mermaid Support Plus

[![](https://vsmarketplacebadges.dev/version/tuanquynet.markdown-mermaid-plus.png)](https://marketplace.visualstudio.com/items?itemName=tuanquynet.markdown-mermaid-plus)

Adds [Mermaid](https://mermaid-js.github.io/mermaid/#/) diagram and flowchart support to VS Code's builtin Markdown preview and to Markdown cells in notebooks, with the ability to export diagrams as SVG or PNG.

This is a maintained fork of [`bierner.markdown-mermaid`](https://github.com/mjbvz/vscode-markdown-mermaid), which was deprecated after being merged into VS Code 1.121.

![A mermaid diagram in VS Code's built-in markdown preview](https://github.com/tuanquynet/vscode-markdown-mermaid/raw/master/docs/example.png)

Currently supports Mermaid version 11.12.0.

## Usage

Create diagrams in markdown using `mermaid` fenced code blocks:

````markdown
```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```
````

You can also use `:::` blocks:

```markdown
::: mermaid
graph TD;
A-->B;
A-->C;
B-->D;
C-->D;
:::
```

Supports [MDI](https://icon-sets.iconify.design/mdi/) and [logos](https://icon-sets.iconify.design/logos/) icons from Iconify:

````markdown
```mermaid
architecture-beta
    service user(mdi:account)
    service lambda(logos:aws-lambda)

    user:R --> L:lambda
```
````

## Navigating Diagrams

Mermaid diagrams support panning and zooming to help explore large or complex diagrams. By default, navigation controls appear when you hover over or focus on a diagram. You can also navigate diagrams using the mouse:

### Zooming

To zoom in and out of diagrams:

- **Zoom controls** — Use the `+` and `-` buttons that appear in the navigation controls
- **Scroll wheel** — Hold <kbd>alt</kbd> (<kbd>option</kbd> on Mac) and scroll to zoom
- **Pinch-to-zoom** — Use a trackpad pinch gesture
- **Click zoom** — Alt+click to zoom in, Alt+Shift+click to zoom out

To reset the zoom level and position, click the `reset` button in the controls.

### Panning

To pan around a diagram:

- **Click and drag** — Hold <kbd>alt</kbd> (<kbd>option</kbd> on Mac) and click and drag to pan
- **Pan mode** — Click the `pan mode` button in the navigation controls to enable click-and-drag panning without holding <kbd>alt</kbd>. Click it again to turn off `pan mode`.

By default, click-and-drag panning requires holding the <kbd>alt</kbd> key to prevent accidental panning. Use `markdown-mermaid-plus.mouseNavigation.enabled` to change this:

- `always` — Click and drag always pans (no modifier key needed)
- `alt` — Click and drag only pans when holding <kbd>alt</kbd> (default)
- `never` — Disable mouse-based panning (controls and pinch-to-zoom still work)

### Resizing

Diagrams can be resized vertically by dragging the bottom edge. This is most useful if you use the `markdown-mermaid-plus.maxHeight` setting or use css to limit the diagram's natural size.

Use `markdown-mermaid-plus.resizable` to disable this behavior, or `markdown-mermaid-plus.maxHeight` to set a maximum height.

## Exporting Diagrams

Each diagram's navigation controls include an **Export** button. Click it to open a menu and choose a format:

- **Export as SVG** — Downloads the diagram as a standalone `.svg` file. Computed styles are inlined so the file renders correctly outside of VS Code.
- **Export as PNG** — Downloads the diagram as a `.png` file, rasterized at 2x resolution with the preview's background color applied so themed diagrams stay readable.

Files are named after the diagram's content hash (for example `mermaid-766cf408.svg`).

## Configuration

### `markdown-mermaid-plus.lightModeTheme`

Configures the Mermaid theme used when VS Code is using a light color theme. Supported values:

- `base`
- `forest`
- `dark`
- `default`
- `neutral`

Currently not supported in notebooks.

### `markdown-mermaid-plus.darkModeTheme`

Configures the Mermaid theme used when VS Code is using a dark color theme. Supported values:

- `base`
- `forest`
- `dark`
- `default`
- `neutral`

Currently not supported in notebooks.

### `markdown-mermaid-plus.languages`

Configures language ids used to identify Mermaid code blocks in markdown. The default is `["mermaid"]`.

### `markdown-mermaid-plus.mouseNavigation.enabled`

Controls when mouse-based navigation (panning and zooming) is enabled. The default is `alt`. Supported values:

- `always` — Always enable mouse navigation on mermaid diagrams
- `alt` — Only enable mouse navigation when holding down <kbd>alt</kbd> (<kbd>option</kbd> on Mac)
- `never` — Disable mouse navigation

### `markdown-mermaid-plus.controls.show`

When to show navigation control buttons. The default is `onHoverOrFocus`. Supported values:

- `never` — Never show navigation controls
- `onHoverOrFocus` — Show navigation controls when hovering over or focusing on a diagram
- `always` — Always show navigation controls

### `markdown-mermaid-plus.resizable`

Allow diagrams to be resized vertically by dragging the bottom edge. The default is `true`.

When enabled, you can drag the bottom edge of any diagram to adjust its height. The custom height is preserved as long as the diagram content doesn't change.

### `markdown-mermaid-plus.maxHeight`

Maximum height for diagrams. Can be a number (pixels) or a CSS value like `80vh` or `400px`. Leave empty for no limit. The default is empty (no limit).

Examples:

- `400` — 400 pixels.
- `80vh` — 80% of the viewport (markdown-preview) height.

### `markdown-mermaid-plus.maxTextSize`

Maximum allowed size of diagram text. The default is `50000`.

## Using custom CSS in the Markdown Preview

You can use the built-in functionality to add custom CSS. More info can be found in the [markdown.styles documentation](https://code.visualstudio.com/Docs/languages/markdown#_using-your-own-css)

For example, add Font Awesome like this:

```json
"markdown.styles": [
    "https://use.fontawesome.com/releases/v5.7.1/css/all.css"
]
```

Use it like this:

````markdown
```mermaid
graph LR
    fa:fa-check-->fa:fa-coffee
```
````
