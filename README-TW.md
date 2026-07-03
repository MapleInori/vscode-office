# Office Viewer

[English](README.md) | [简体中文](README-CN.md) | 繁體中文

## 介紹

本擴充功能專注於在 VS Code 中輕量編輯 Markdown 和 CSV/TSV 檔案：

- Markdown: `.md`、`.markdown`
- CSV/TSV: `.csv`、`.tsv`

本擴充功能不再提供 PDF、DOCX、HTML、SVG 或字型檔案的自訂預覽/編輯器。

## Markdown

整合 Markdown 所見即所得編輯器。

如需使用 VS Code 原生 Markdown 編輯器，請在 `settings.json` 中新增以下設定：

```json
{
    "workbench.editorAssociations": {
        "*.md": "default",
        "*.markdown": "default"
    }
}
```

在編輯器中按右鍵，可將 Markdown 匯出為 PDF、DOCX 或 HTML。PDF 匯出依賴 Chromium，可透過 `vscode-office-lit.chromiumPath` 設定瀏覽器路徑。

![匯出 Markdown](image/README-CN/1685418034035.png)

快捷鍵：基於 [shortcut.md](shortcut.md)，以及：

- 將清單上移一行: `Ctrl Alt I` / `⌘ ^ I`
- 將清單下移一行: `Ctrl Alt J` / `⌘ ^ J`
- 在 VS Code 中編輯: `Ctrl Alt E` / `⌘ ^ E`

## 其他功能

- CSV/TSV: 支援預覽與儲存分隔符文字檔案。
- 主題: 提供 **One Dark Modern** 配色主題。

## Sponsor

[![Database Client](https://database-client.com/text_logo.png)](https://marketplace.visualstudio.com/items?itemName=cweijan.vscode-database-client2)

適用於 Visual Studio Code 的資料庫用戶端，支援 **MySQL/MariaDB、PostgreSQL、SQLite、Redis** 以及 **ElasticSearch** 等資料庫的管理，且可作為 SSH 用戶端，極大地提升您的生產力！[立刻安裝](https://marketplace.visualstudio.com/items?itemName=cweijan.vscode-database-client2)。

## 開發指南

### 環境要求

- [Node.js](https://nodejs.org/) 18+
- [VS Code](https://code.visualstudio.com/) 1.64+

### 快速開始

```bash
git clone https://github.com/cweijan/vscode-office.git
cd vscode-office
npm install
```

### 開發除錯

**桌面端擴充功能**：

```bash
npm run dev
```

在 VS Code 中按 `F5`，或在「執行和偵錯」中選擇 **Extension**。

**Web 端擴充功能**：

```bash
npm run dev:web
```

在「執行和偵錯」中選擇 **Extension (Web)**。

### 建置與打包

```bash
npm run build    # 生產建置
npm run package  # 產生 .vsix
```

## Credits

- Spreadsheet UI: [myliang/x-spreadsheet](https://github.com/myliang/x-spreadsheet)
- Markdown: [Vanessa219/vditor](https://github.com/Vanessa219/vditor)
