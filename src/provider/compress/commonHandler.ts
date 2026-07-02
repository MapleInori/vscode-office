import * as vscode from 'vscode';
import { basename, join, parse } from 'path';
import { Handler } from '@/common/handler';
import { isUriReadOnly } from '@/common/fileReadOnly';
import { Uri, workspace } from 'vscode';
import { emitFileOfficeOpen, emitVirtualOfficeOpen, isVirtualUri } from '@/provider/handlers/officeContent';
import { TelemetryService } from '@/service/telemetryService';

const fileSaveTimes: Record<string, number> = {};

export function shouldSkipFileChange(uri: Uri): boolean {
    const lastSaveTime = fileSaveTimes[uri.toString()];
    return !!(lastSaveTime && Date.now() - lastSaveTime < 100);
}

function setDirty(handler: Handler, uri: Uri, dirty: boolean) {
    const panel = handler.panel;
    const fileName = basename(uri.fsPath);
    panel.title = dirty ? `● ${fileName}` : fileName;
    if (dirty) {
        void vscode.commands.executeCommand('workbench.action.keepEditor');
    }
}

export function handleCommonEvent(uri: Uri, handler: Handler, options?: { skipOpen?: boolean }) {
    let readOnly = false;
    const send = async () => {
        if (shouldSkipFileChange(uri)) return;
        readOnly = await isUriReadOnly(uri);
        if (isVirtualUri(uri)) {
            void emitVirtualOfficeOpen(handler, uri);
            return;
        }
        await emitFileOfficeOpen(handler, uri, handler.panel.webview);
    };
    const events = handler
        .on('editInVSCode', (full: boolean) => {
            const side = full ? vscode.ViewColumn.Active : vscode.ViewColumn.Beside;
            vscode.commands.executeCommand('vscode.openWith', uri, 'default', side);
        });
    if (!options?.skipOpen) {
        events.on('init', () => { void send(); }).on('fileChange', () => { void send(); });
    }
    events
        .on('change', () => {
            setDirty(handler, uri, true);
        })
        .on('save', async (content) => {
            const res = Array.isArray(content) ? new Uint8Array(content) : new TextEncoder().encode(content);
            if (readOnly) {
                handler.emit('saveAs', { content: [...res] });
                return;
            }
            await workspace.fs.writeFile(uri, res);
            fileSaveTimes[uri.toString()] = Date.now();
            setDirty(handler, uri, false);
            handler.emit('saveDone');
        })
        .on('saveAs', async (payload: { content: number[], ext?: string }) => {
            const res = new Uint8Array(payload.content);
            const ext = (payload.ext ?? 'csv').toLowerCase();
            const { dir, name } = parse(uri.fsPath);
            const defaultFileName = `${name}.${ext}`;
            const defaultUri = uri.scheme === 'file'
                ? Uri.file(join(dir, defaultFileName))
                : Uri.joinPath(uri, '..', defaultFileName);
            const filterMap: Record<string, { label: string; exts: string[] }> = {
                csv: { label: 'CSV (Comma delimited)', exts: ['csv'] },
                tsv: { label: 'TSV (Tab delimited)', exts: ['tsv'] },
            };
            const info = filterMap[ext] ?? { label: ext.toUpperCase(), exts: [ext] };
            const target = await vscode.window.showSaveDialog({
                defaultUri,
                filters: { [info.label]: info.exts },
            });
            if (!target) return;
            await workspace.fs.writeFile(target, res);
            fileSaveTimes[target.toString()] = Date.now();
            setDirty(handler, uri, false);
            handler.emit('saveDone');
            await vscode.commands.executeCommand('vscode.openWith', target, 'mapleinori.officeViewerLit');
        })
        .on('developerTool', () => vscode.commands.executeCommand('workbench.action.toggleDevTools'))
        .on('openExternal', (url: string) => {
            if (url) vscode.env.openExternal(vscode.Uri.parse(url));
        })
        .on('telemetry', (payload: { event: string; properties?: Record<string, string | number | boolean> }) => {
            const properties = Object.fromEntries(
                Object.entries(payload.properties ?? {}).map(([key, value]) => [key, String(value)]),
            );
            TelemetryService.get()?.trackEvent(payload.event, properties);
        })
        .on('dispose', () => {
            delete fileSaveTimes[uri.toString()];
        });
}