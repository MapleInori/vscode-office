import { inferSchema, initParser } from 'udsv';
import { decodeCsvBuffer } from './csvEncoding';
import type { CellData, SheetData } from './x-spreadsheet/index';

type RowMap = NonNullable<SheetData['rows']>;

export interface ExcelData {
    sheets: SheetData[];
    maxCols: number;
    maxLength?: number;
    /** Detected column delimiter when loading CSV/TSV */
    csvDelimiter?: string;
}

const MIN_COL_WIDTH = 70;
const MAX_COL_WIDTH = 300;
const CHAR_WIDTH = 8;
const MAX_ROWS_TO_CHECK = 10;

const clampColWidth = (width: number) => Math.min(Math.max(width, MIN_COL_WIDTH), MAX_COL_WIDTH);

const calculateColWidth = (rows: string[][], colIndex: number): number => {
    let maxLength = 0;
    for (let i = 0; i < Math.min(rows.length, MAX_ROWS_TO_CHECK); i += 1) {
        const cell = rows[i][colIndex];
        if (cell) {
            const length = String(cell).length;
            if (length > maxLength) maxLength = length;
        }
    }
    return clampColWidth(maxLength * CHAR_WIDTH);
};

const buildCsvCols = (rows: string[][], colCount: number) => {
    const cols: Record<number, { width: number }> = {};
    for (let i = 0; i < colCount; i += 1) {
        cols[i] = { width: calculateColWidth(rows, i) };
    }
    return cols;
};

const loadCsv = (buffer: ArrayBuffer): ExcelData => {
    let maxCols = 26;
    const emptySheet = { maxCols, sheets: [{ name: 'Sheet1', rows: { len: 0 } }] };
    let csvStr = decodeCsvBuffer(buffer);
    if (!csvStr) return emptySheet;

    try {
        if (!csvStr.includes('\n')) csvStr += '\n';
        const schema = inferSchema(csvStr, { header: () => [] });
        const rows = initParser(schema).stringArrs(csvStr);
        const colCount = rows[0]?.length || 0;

        const processedRows: RowMap = {};
        for (let i = 0; i < rows.length; i += 1) {
            const row = rows[i];
            const cells: Record<number, CellData> = {};
            for (let j = 0; j < row.length; j += 1) {
                cells[j] = { text: row[j] == null ? '' : String(row[j]) };
                if (j + 1 > maxCols) maxCols = j + 1;
            }
            processedRows[i] = { cells };
        }

        return {
            maxCols,
            maxLength: rows.length,
            csvDelimiter: schema.col,
            sheets: [{
                name: 'Sheet1',
                rows: { len: rows.length, ...processedRows },
                cols: { len: colCount, ...buildCsvCols(rows, colCount) },
            }],
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(error);
        return { maxCols, sheets: [{ name: 'Sheet1', rows: { len: 1, 0: { cells: { 0: { text: message } } } } }] };
    }
};

export async function loadSheets(buffer: ArrayBuffer, ext: string): Promise<ExcelData> {
    const normalized = ext.replace(/^\./, '').toLowerCase();
    if (normalized !== 'csv' && normalized !== 'tsv') {
        throw new Error(`Unsupported table format: ${ext}`);
    }
    return loadCsv(buffer);
}

export function readCSV(buffer: ArrayBuffer): ExcelData {
    return loadCsv(buffer);
}