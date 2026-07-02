import { handler } from '../../util/vscode';
import Spreadsheet from './x-spreadsheet/index';
import type { RowData, SheetData } from './x-spreadsheet/index';
import { CsvEncoding, encodeCsvText } from './csvEncoding';

export interface ExportOptions {
    /** 通过另存为对话框保存，而非覆盖当前文件 */
    saveAs?: boolean;
    /** saveAs 时指定目标格式 */
    saveAsExt?: string;
}

function isRowData(row: RowData | number | undefined): row is RowData {
    return row != null && typeof row === 'object';
}

function getSheetText(sheet: SheetData, ri: number, ci: number): string {
    const row = sheet.rows?.[ri];
    if (!isRowData(row)) return '';
    return row.cells?.[ci]?.text ?? '';
}

function getMaxCol(sheet: SheetData): number {
    let maxCol = sheet.cols?.len ?? 0;
    const rows = sheet.rows;
    if (!rows?.len) return maxCol;
    for (let ri = 0; ri < rows.len; ri += 1) {
        const row = rows[ri];
        if (!isRowData(row) || !row.cells) continue;
        for (const ciKey of Object.keys(row.cells)) {
            const ci = Number(ciKey);
            if (!Number.isNaN(ci) && ci + 1 > maxCol) maxCol = ci + 1;
        }
    }
    return maxCol;
}

function escapeDelimitedCell(text: string, delimiter: string): string {
    const value = text ?? '';
    if (value.includes('"') || value.includes('\n') || value.includes('\r') || value.includes(delimiter)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function sheetToDelimitedText(sheet: SheetData, delimiter: string): string {
    const rowLen = sheet.rows?.len ?? 0;
    const colLen = getMaxCol(sheet);
    const lines: string[] = [];
    for (let ri = 0; ri < rowLen; ri += 1) {
        const cells: string[] = [];
        for (let ci = 0; ci < colLen; ci += 1) {
            cells.push(escapeDelimitedCell(getSheetText(sheet, ri, ci), delimiter));
        }
        lines.push(cells.join(delimiter));
    }
    return lines.join('\n');
}

function emitDelimited(spreadSheet: Spreadsheet, ext: string, csvEncoding: CsvEncoding, csvDelimiter: string, saveAs: boolean) {
    const targetExt = ext.replace(/^\./, '').toLowerCase() === 'tsv' ? 'tsv' : 'csv';
    const delimiter = targetExt === 'tsv' ? '\t' : csvDelimiter;
    const sheets = spreadSheet.getData();
    const content = sheetToDelimitedText(sheets[0] ?? { name: 'Sheet1', rows: { len: 0 } }, delimiter);
    const bytes = encodeCsvText(content, csvEncoding);
    if (saveAs) {
        handler.emit('saveAs', { content: [...bytes], ext: targetExt });
        return;
    }
    handler.emit('save', [...bytes]);
}

export async function exportSaveAs(
    spreadSheet: Spreadsheet,
    targetExt: string,
    csvEncoding: CsvEncoding = 'utf8',
    csvDelimiter: string = ',',
) {
    emitDelimited(spreadSheet, targetExt, csvEncoding, csvDelimiter, true);
}

export async function export_xlsx(
    spreadSheet: Spreadsheet,
    extName: string,
    csvEncoding: CsvEncoding = 'utf8',
    options?: ExportOptions,
    csvDelimiter: string = ',',
) {
    emitDelimited(spreadSheet, options?.saveAsExt ?? extName, csvEncoding, csvDelimiter, options?.saveAs === true);
}

export function buildFormattingSnapshot() {
    return '';
}

export function hasFormattingChanged() {
    return false;
}