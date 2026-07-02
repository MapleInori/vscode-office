import { getFileSuffix } from '@/common/fileSuffix';

export function resolveOfficeViewType(fsPath: string, route?: string): string | undefined {
    if (route) return route;
    const suffix = getFileSuffix(fsPath);
    if (suffix === '.csv' || suffix === '.tsv') return 'csv';
    return undefined;
}

export function fileTypeFromPath(fsPath: string): string {
    const suffix = getFileSuffix(fsPath);
    return suffix.startsWith('.') ? suffix.slice(1) : suffix;
}