import * as vscode from 'vscode';
import { Global } from './common/global';
import { TelemetryService } from './service/telemetryService';
import { MarkdownEditorProvider } from './provider/markdownEditorProvider';
import { OfficeViewerProvider } from './provider/officeViewerProvider';
import { MarkdownService } from './service/markdownService';
import { switchCsvEditor } from './service/csvService';
import { FileUtil } from './common/fileUtil';
import { ReactApp } from './common/reactApp';
import { activateYaml } from './provider/yaml';
import { activateXml } from './provider/xml';

export async function activate(context: vscode.ExtensionContext) {
    await Global.init(context);
    TelemetryService.init(context);
    activateYaml(context);
    activateXml(context);
    const viewOption = { webviewOptions: { retainContextWhenHidden: false } };
    FileUtil.init(context);
    ReactApp.init(context);
    const markdownService = new MarkdownService(context);
    const viewerInstance = new OfficeViewerProvider(context);
    const markdownEditorProvider = new MarkdownEditorProvider(context);
    context.subscriptions.push(
        vscode.commands.registerCommand('office-lit.markdown.switch', (uri) => { markdownService.switchEditor(uri); }),
        vscode.commands.registerCommand('office-lit.csv.switch', (uri) => { switchCsvEditor(uri); }),
        vscode.commands.registerCommand('office-lit.markdown.paste', () => { markdownService.loadClipboardImage(); }),
        vscode.window.registerCustomEditorProvider('mapleinori.markdownViewerLit', markdownEditorProvider, viewOption),
        vscode.window.registerCustomEditorProvider('mapleinori.markdownPreviewLit', markdownEditorProvider, viewOption),
        ...viewerInstance.bindCustomEditors(viewOption),
    );
}

export function deactivate() { }