import { getToolbar, bindShortcut, createContextMenu } from "./util.js";
import { mapVscodeLanguageToVditorLang } from "./lang.js";

const SAVE_DEBOUNCE_MS = 500;
const LARGE_DOCUMENT_BYTES = 100 * 1024;
const LARGE_DOCUMENT_LINES = 3000;

const runAfterFirstPaint = (task) => {
  requestAnimationFrame(() => window.setTimeout(task, 0));
};

const countLines = (text) => {
  let lines = 1;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) lines++;
  }
  return lines;
};

const getDocumentProfile = (content) => {
  const lineCount = countLines(content);
  const hasMermaid = /(^|\n)(```|~~~)\s*mermaid\b/i.test(content);
  const hasMath = /(^|\n)\s*\$\$|\$\$\s*(\n|$)|(^|[^\\])\$[^$\n]+(^|[^\\])\$/m.test(content);
  const largeDocument = content.length >= LARGE_DOCUMENT_BYTES || lineCount >= LARGE_DOCUMENT_LINES;
  return { lineCount, hasMermaid, hasMath, largeDocument };
};

handler.on("open", async (md) => {
  const { content, rootPath, documentCacheId, pendingFragment, config } = md;
  const {
    language, isWeb, isDev, markdown,
    editMode, editorTheme, codeMirrorTheme, mermaidTheme
  } = config;
  if (isWeb) {
    document.body.classList.add('is-web')
  }

  const documentProfile = getDocumentProfile(content);
  const restoreDelay = documentProfile.largeDocument ? 1200 : 200;

  let pendingSaveContent;
  let saveTimer;
  const flushPendingSave = () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = undefined;
    }
    if (pendingSaveContent === undefined) return;
    const contentToSave = pendingSaveContent;
    pendingSaveContent = undefined;
    handler.emit("save", contentToSave);
  };
  const scheduleSave = (nextContent) => {
    pendingSaveContent = nextContent;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = window.setTimeout(flushPendingSave, SAVE_DEBOUNCE_MS);
  };
  window.addEventListener('beforeunload', flushPendingSave);
  window.addEventListener('blur', flushPendingSave);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushPendingSave();
  });

  let editor;
  let initialContentLoaded = false;
  const initialContent = "";
  const initialEditMode = documentProfile.largeDocument ? "wysiwyg" : editMode;
  const loadEditorContent = (nextContent, markSaved = false) => {
    const apply = () => {
      editor.setValue(nextContent);
      if (markSaved) {
        editor.markSaved(nextContent);
      }
    };
    if (documentProfile.largeDocument) {
      runAfterFirstPaint(apply);
    } else {
      apply();
    }
  };

  editor = new Vditor('vditor', {
    value: initialContent,
    cdn: rootPath,
    height: '100%',
    outline: {
      enable: !documentProfile.largeDocument,
      position: 'left',
    },
    cache: {
      enable: false,
      id: documentCacheId,
      focusHost: 'vscode',
    },
    mode: initialEditMode,
    editorTheme,
    codeMirrorTheme,
    mermaidTheme,
    lang: mapVscodeLanguageToVditorLang(language),
    tab: '\t',
    toolbar: await getToolbar(rootPath, () => {
      flushPendingSave();
      handler.emit('doSave', editor?.getValue());
      editor?.markSaved();
    }),
    onLinkClick(payload, event) {
      const isCompose = event.metaKey || event.ctrlKey;
      if (payload.action !== "dblclick" && !(payload.action === "click" && isCompose)) {
        return;
      }
      const uri = payload.href;
      handler.emit("openLink", uri);
    },
    debugger: isDev,
    changeEditorTheme(theme) {
      handler.emit('editorTheme', theme)
    },
    changeCodeTheme(theme) {
      handler.emit('codeMirrorTheme', theme)
    },
    changeMermaidTheme(theme) {
      handler.emit('mermaidTheme', theme)
    },
    changeEditMode(mode) {
      handler.emit('editMode', mode)
    },
    onSettingsChange(settings) {
      handler.emit('syncViewerSettings', settings)
    },
    onEditSettings() {
      handler.emit('editViewerSettings', editor.exportViewerSettings())
    },
    input(content) {
      scheduleSave(content)
    },
    upload: {
      url: '/image',
      accept: 'image/*',
      handler(files) {
        const file = files[0];
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        let reader = new FileReader();
        reader.readAsBinaryString(file);
        reader.onloadend = () => {
          handler.emit("img", { data: reader.result, ext })
        };
      }
    },
    onTelemetry(event, properties) {
      handler.emit('telemetry', { event, properties });
    },
    preview: {
      markdown: {
        codeBlockPreview: !documentProfile.largeDocument || documentProfile.hasMermaid,
        mathBlockPreview: documentProfile.hasMath,
      },
      math: {
        macros: markdown?.math?.macros ?? {},
      },
    },
    after() {
      const applyViewerSettingsPayload = (viewerSettings) => {
        if (viewerSettings?.enabled) {
          editor.setViewerSettingsSyncEnabled(true);
          if (viewerSettings.settings) {
            editor.applyViewerSettings(viewerSettings.settings);
          }
        }
      };

      handler.on('viewerSettingsSync', ({ enabled }) => {
        editor.setViewerSettingsSyncEnabled(!!enabled);
      });
      handler.on('viewerSettings', (settings) => {
        editor.applyViewerSettings(settings);
      });
      handler.on('markdownConfig', (update) => {
        if (update.editorTheme !== undefined) {
          editor.setEditorTheme(update.editorTheme);
        }
        if (update.codeMirrorTheme !== undefined) {
          Vditor.setCodeTheme(update.codeMirrorTheme, editor.vditor?.element);
        }
        if (update.mermaidTheme !== undefined) {
          editor.setMermaidTheme(update.mermaidTheme);
        }
        if (update.editMode !== undefined) {
          editor.switchEditMode(update.editMode);
        }
      });
      handler.on("update", content => {
        if (document.querySelector("[data-type='yaml-front-matter'].vditor-code-block--cm .cm-editor.cm-focused")) {
          return;
        }
        if (editor.getValue() === content) {
          return;
        }
        initialContentLoaded = true;
        loadEditorContent(content, true);
      })
      handler.on("gotoBlock", (fragment) => {
        if (fragment) {
          editor.scrollToBlock(fragment);
        }
      })

      runAfterFirstPaint(() => {
        if (!initialContentLoaded) {
          initialContentLoaded = true;
          loadEditorContent(content, true);
        }
        applyViewerSettingsPayload(md.viewerSettings);
        handler.emit('requestViewerSettings');
        window.setTimeout(() => {
          editor.restoreDocumentSession(true)
          if (pendingFragment) {
            editor.scrollToBlock(pendingFragment);
          }
        }, restoreDelay);
      });
    }
  })
  bindShortcut(handler, editor);
  createContextMenu(editor)
}).emit("init")
