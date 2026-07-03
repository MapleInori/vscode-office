# Office Viewer

[English](README.md) | 简体中文 | [繁體中文](README-TW.md)

## 介绍

本扩展专注于在 VS Code 中轻量编辑 Markdown 和 CSV/TSV 文件：

- Markdown: `.md`、`.markdown`
- CSV/TSV: `.csv`、`.tsv`

本扩展不再提供 PDF、DOCX、HTML、SVG 或字体文件的自定义预览/编辑器。

## Markdown

集成 Markdown 所见即所得编辑器。

如需使用 VS Code 原生 Markdown 编辑器，请在 `settings.json` 中添加以下配置：

```json
{
    "workbench.editorAssociations": {
        "*.md": "default",
        "*.markdown": "default"
    }
}
```

在编辑器中右键，可将 Markdown 导出为 PDF、DOCX 或 HTML。PDF 导出依赖 Chromium，可通过 `vscode-office-lit.chromiumPath` 配置浏览器路径。

![导出 Markdown](image/README-CN/1685418034035.png)

快捷键：基于 [shortcut.md](shortcut.md)，以及：

- 将列表上移一行: `Ctrl Alt I` / `⌘ ^ I`
- 将列表下移一行: `Ctrl Alt J` / `⌘ ^ J`
- 在 VS Code 中编辑: `Ctrl Alt E` / `⌘ ^ E`

## 其他功能

- CSV/TSV: 支持预览和保存分隔符文本文件。
- 主题: 提供 **One Dark Modern** 配色主题。

## Sponsor

[![Database Client](https://database-client.com/text_logo.png)](https://marketplace.visualstudio.com/items?itemName=cweijan.vscode-database-client2)

适用于 Visual Studio Code 的数据库客户端，支持 **MySQL/MariaDB、PostgreSQL、SQLite、Redis** 以及 **ElasticSearch** 等数据库的管理，且可作为一个 SSH 客户端，极大地提升您的生产力！[立刻安装](https://marketplace.visualstudio.com/items?itemName=cweijan.vscode-database-client2)。

## 开发指南

### 环境要求

- [Node.js](https://nodejs.org/) 18+
- [VS Code](https://code.visualstudio.com/) 1.64+

### 快速开始

```bash
git clone https://github.com/cweijan/vscode-office.git
cd vscode-office
npm install
```

### 开发调试

**桌面端扩展**：

```bash
npm run dev
```

在 VS Code 中按 `F5`，或在「运行和调试」中选择 **Extension**。

**Web 端扩展**：

```bash
npm run dev:web
```

在「运行和调试」中选择 **Extension (Web)**。

### 构建与打包

```bash
npm run build    # 生产构建
npm run package  # 生成 .vsix
```

## Credits

- Spreadsheet UI: [myliang/x-spreadsheet](https://github.com/myliang/x-spreadsheet)
- Markdown: [Vanessa219/vditor](https://github.com/Vanessa219/vditor)
