# Office Viewer

English | [简体中文](README-CN.md) | [繁體中文](README-TW.md)

## Introduction

This extension focuses on lightweight Markdown and CSV/TSV editing directly in VS Code.

- Markdown: `.md`, `.markdown`
- CSV/TSV: `.csv`, `.tsv`

It does not provide custom preview/editors for PDF, DOCX, HTML, SVG, or font files.

## Markdown

This extension replaces the default Markdown editor with a WYSIWYG editor.

To use the built-in VS Code Markdown editor instead, add this to your `settings.json`:

```json
{
    "workbench.editorAssociations": {
        "*.md": "default",
        "*.markdown": "default"
    }
}
```

Right-click in the editor to export Markdown to PDF, DOCX, or HTML. PDF export requires Chromium; set the browser path with `vscode-office-lit.chromiumPath`.

![Export Markdown](image/README-CN/1685418034035.png)

Shortcuts: Based on [shortcut.md](shortcut.md), plus:

- Move list up: `Ctrl Alt I` / `⌘ ^ I`
- Move list down: `Ctrl Alt J` / `⌘ ^ J`
- Edit in VS Code: `Ctrl Alt E` / `⌘ ^ E`

Long code blocks are capped (default 400px) with an **expand/collapse** button to view them in full. Change the default height via the editor toolbar's ⚙ Settings → *Code block height* (down to compact, up to unlimited).

## Other features

- CSV/TSV: preview and save delimited text files.
- Theme: includes the **One Dark Modern** color theme.

## Sponsor

[![Database Client](https://database-client.com/text_logo.png)](https://marketplace.visualstudio.com/items?itemName=cweijan.vscode-database-client2)

Database Client for Visual Studio Code, supporting the management of **MySQL/MariaDB, PostgreSQL, SQLite, Redis**, and **ElasticSearch**, and works as an **SSH** client to boost your productivity! [Get it now](https://marketplace.visualstudio.com/items?itemName=cweijan.vscode-database-client2).

## Development Guide

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [VS Code](https://code.visualstudio.com/) 1.64+

### Getting started

```bash
git clone https://github.com/cweijan/vscode-office.git
cd vscode-office
npm install
```

### Development

**Desktop extension**:

```bash
npm run dev
```

Press `F5` in VS Code, or choose **Extension** from Run and Debug.

**Web extension**:

```bash
npm run dev:web
```

Choose **Extension (Web)** from Run and Debug.

### Build & package

```bash
npm run build    # production build
npm run package  # create .vsix
```

## Credits

- Spreadsheet UI: [myliang/x-spreadsheet](https://github.com/myliang/x-spreadsheet)
- Markdown: [Vanessa219/vditor](https://github.com/Vanessa219/vditor)
