import { ReactApp } from '@/common/reactApp';
import { getFileSuffix } from '@/common/fileSuffix';
import * as vscode from 'vscode';
import { Handler } from '../common/handler';
import { handleCommonEvent } from './compress/commonHandler';
import { TelemetryService } from '@/service/telemetryService';
import { getExtensionResourceRoots } from '@/common/extensionResource';

/** CSV/TSV custom editor. */
export class OfficeViewerProvider implements vscode.CustomReadonlyEditorProvider {

    constructor(private context: vscode.ExtensionContext) { }

    bindCustomEditors(viewOption: { webviewOptions: vscode.WebviewPanelOptions }) {
        return [
            vscode.window.registerCustomEditorProvider('mapleinori.officeViewerLit', this, viewOption),
        ];
    }

    public openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
        return { uri, dispose: (): void => { } };
    }

    public resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
        const uri = document.uri;
        const suffix = getFileSuffix(uri.fsPath);
        if (suffix !== '.csv' && suffix !== '.tsv') {
            void vscode.commands.executeCommand('vscode.openWith', uri, 'default');
            return;
        }

        const folderPath = vscode.Uri.joinPath(uri, '..');
        const webview = webviewPanel.webview;
        webview.options = {
            enableScripts: true,
            localResourceRoots: [...getExtensionResourceRoots(this.context), folderPath],
        };

        const handler = Handler.bind(webviewPanel, uri);
        handleCommonEvent(uri, handler);
        TelemetryService.get()?.trackOfficeViewOpen(uri.fsPath, 'csv', suffix.slice(1));
        return ReactApp.view(webview, { route: 'excel' });
    }

}