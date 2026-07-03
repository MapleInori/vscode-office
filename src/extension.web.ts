/**
 * Web extension host entry (`package.json#browser`).
 * Desktop-only: clipboard paste.
 */
import * as vscode from 'vscode';
import { Global } from './common/global';
import { FileUtil } from './common/fileUtil';
import { setExtensionHostContext } from './common/extensionHost';
import { ReactApp } from './common/reactApp';
import { MarkdownEditorProvider } from './provider/markdownEditorProvider';
import { OfficeViewerProvider } from './provider/officeViewerProvider';
import { MarkdownService } from './service/markdownService';
import { switchCsvEditor } from './service/csvService';

export async function activate(context: vscode.ExtensionContext) {
    setExtensionHostContext();
    await Global.init(context);
    FileUtil.init(context);
    ReactApp.init(context);

    const markdownViewOption = { webviewOptions: { retainContextWhenHidden: true } };
    const viewerViewOption = { webviewOptions: { retainContextWhenHidden: false } };
    const markdownService = new MarkdownService(context);
    const markdownEditorProvider = new MarkdownEditorProvider(context, { isWeb: true });
    const viewerInstance = new OfficeViewerProvider(context);

    context.subscriptions.push(
        vscode.commands.registerCommand('office-lit.markdown.switch', (uri) => { markdownService.switchEditor(uri); }),
        vscode.commands.registerCommand('office-lit.csv.switch', (uri) => { switchCsvEditor(uri); }),
        vscode.window.registerCustomEditorProvider('mapleinori.markdownViewerLit', markdownEditorProvider, markdownViewOption),
        vscode.window.registerCustomEditorProvider('mapleinori.markdownPreviewLit', markdownEditorProvider, markdownViewOption),
        ...viewerInstance.bindCustomEditors(viewerViewOption),
    );
}

export function deactivate() { }
