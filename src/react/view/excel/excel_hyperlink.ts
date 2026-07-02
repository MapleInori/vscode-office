export type ParsedLink =
    | { type: 'external'; url: string }
    | { type: 'internal'; sheetName: string; ref: string };

export function parseSpreadsheetLink(link: string): ParsedLink {
    const trimmed = link.trim();
    if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) {
        return { type: 'external', url: trimmed };
    }
    const quoted = trimmed.match(/^#?'([^']+)'!([A-Za-z]+\d+)$/);
    if (quoted) {
        return { type: 'internal', sheetName: quoted[1], ref: quoted[2].toUpperCase() };
    }
    const plain = trimmed.match(/^#?([^!]+)!([A-Za-z]+\d+)$/);
    if (plain) {
        return { type: 'internal', sheetName: plain[1], ref: plain[2].toUpperCase() };
    }
    return { type: 'external', url: trimmed };
}