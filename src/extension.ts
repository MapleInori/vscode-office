import * as vscode from 'vscode';
import { Global } from './common/global';
import { MarkdownEditorProvider } from './provider/markdownEditorProvider';
import { OfficeViewerProvider } from './provider/officeViewerProvider';
import { MarkdownService } from './service/markdownService';
import { switchCsvEditor } from './service/csvService';
import { FileUtil } from './common/fileUtil';
import { ReactApp } from './common/reactApp';

export async function activate(context: vscode.ExtensionContext) {
    await Global.init(context);
    const markdownViewOption = { webviewOptions: { retainContextWhenHidden: true } };
    const viewerViewOption = { webviewOptions: { retainContextWhenHidden: false } };
    FileUtil.init(context);
    ReactApp.init(context);
    const markdownService = new MarkdownService(context);
    const viewerInstance = new OfficeViewerProvider(context);
    const markdownEditorProvider = new MarkdownEditorProvider(context);
    context.subscriptions.push(
        vscode.commands.registerCommand('office-lit.markdown.switch', (uri) => { markdownService.switchEditor(uri); }),
        vscode.commands.registerCommand('office-lit.csv.switch', (uri) => { switchCsvEditor(uri); }),
        vscode.commands.registerCommand('office-lit.markdown.paste', () => { markdownService.loadClipboardImage(); }),
        vscode.window.registerCustomEditorProvider('mapleinori.markdownViewerLit', markdownEditorProvider, markdownViewOption),
        vscode.window.registerCustomEditorProvider('mapleinori.markdownPreviewLit', markdownEditorProvider, markdownViewOption),
        ...viewerInstance.bindCustomEditors(viewerViewOption),
    );
}

export function deactivate() { }
