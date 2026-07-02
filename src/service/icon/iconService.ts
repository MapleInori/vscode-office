import * as vscode from 'vscode';
import { extensionResource, readExtensionText } from '../../common/extensionResource';
import {
    buildIconMaps,
    IconMaps,
    MaterialIconThemeJson,
    resolveFileIcon,
    resolveFolderIcon,
} from './iconTheme';

export interface WebviewIconConfig {
    iconBaseUrl: string;
    maps: IconMaps;
}

export class IconService {
    private static instance: IconService;
    private maps: IconMaps | null = null;
    private initPromise: Promise<void> | null = null;

    static getInstance(): IconService {
        if (!IconService.instance) {
            IconService.instance = new IconService();
        }
        return IconService.instance;
    }

    async init(context: vscode.ExtensionContext): Promise<void> {
        if (this.maps) return;
        if (!this.initPromise) {
            this.initPromise = (async () => {
                const raw = await readExtensionText(context, 'theme', 'material-icons.json');
                const theme = JSON.parse(raw) as MaterialIconThemeJson;
                this.maps = buildIconMaps(theme);
            })();
        }
        await this.initPromise;
    }

    getMaps(): IconMaps {
        if (!this.maps) {
            throw new Error('IconService is not initialized');
        }
        return this.maps;
    }

    resolveFile(fileName: string): string {
        return resolveFileIcon(fileName, this.getMaps());
    }

    resolveFolder(folderName: string, expanded = false): string {
        return resolveFolderIcon(folderName, this.getMaps(), expanded);
    }

    getFileIconUri(context: vscode.ExtensionContext, fileName: string): vscode.Uri {
        const iconFile = this.resolveFile(fileName);
        return vscode.Uri.joinPath(extensionResource(context, 'icons'), iconFile);
    }

    getWebviewConfig(context: vscode.ExtensionContext, webview: vscode.Webview): WebviewIconConfig {
        return {
            iconBaseUrl: webview.asWebviewUri(extensionResource(context, 'icons')).toString(),
            maps: this.getMaps(),
        };
    }
}
