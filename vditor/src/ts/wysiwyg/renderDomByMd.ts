import {
    isCmCodeBlock,
    renderCodeBlocks,
    renderCodeBlocksNearViewport,
    syncMathBlocksDisplayMode,
} from "../codeBlock/codeMirrorManager";
import {log} from "../util/log";
import {processCodeRender} from "../util/processCode";
import {renderToc} from "../util/toc";
import {afterRenderEvent} from "./afterRenderEvent";

export const BOUNDARY_SENTINEL_CLASS = "vditor-editor-boundary";

const BOUNDARY_SENTINEL = `<span class="${BOUNDARY_SENTINEL_CLASS}" data-block="0" contenteditable="true" aria-hidden="true">​</span>`;
const CHUNKED_RENDER_MIN_LINES = 3000;
const CHUNKED_RENDER_TARGET_LINES = 120;
const CHUNKED_RENDER_MAX_LINES = 220;
const ASYNC_BATCH_BUDGET_MS = 10;

const renderSequences = new WeakMap<IVditor, number>();

export const ensureEditorBoundaryParagraphs = (editorElement: HTMLElement) => {
    editorElement.querySelectorAll(`.${BOUNDARY_SENTINEL_CLASS}`).forEach((el) => el.remove());
    editorElement.insertAdjacentHTML("afterbegin", BOUNDARY_SENTINEL);
    editorElement.insertAdjacentHTML("beforeend", BOUNDARY_SENTINEL);
};

const nextRenderSequence = (vditor: IVditor) => {
    const sequence = (renderSequences.get(vditor) || 0) + 1;
    renderSequences.set(vditor, sequence);
    return sequence;
};

const isCurrentRender = (vditor: IVditor, sequence: number) => renderSequences.get(vditor) === sequence;

const countLines = (text: string) => {
    let lines = 1;
    for (let i = 0; i < text.length; i++) {
        if (text.charCodeAt(i) === 10) {
            lines++;
        }
    }
    return lines;
};

const shouldChunkRender = (md: string) => countLines(md) >= CHUNKED_RENDER_MIN_LINES;

const escapeHtml = (text: string) => text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const isFenceLine = (line: string) => /^(\s*)(`{3,}|~{3,})/.test(line);

const splitMarkdownForChunkedRender = (md: string) => {
    const lines = md.split("\n");
    const chunks: string[] = [];
    let start = 0;
    let inFence = false;
    let fenceChar = "";
    let fenceLength = 0;

    const pushChunk = (endExclusive: number) => {
        if (endExclusive <= start) {
            return;
        }
        chunks.push(lines.slice(start, endExclusive).join("\n"));
        start = endExclusive;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const fence = line.match(/^(\s*)(`{3,}|~{3,})/);
        if (fence) {
            const marker = fence[2];
            const markerChar = marker.charAt(0);
            if (!inFence) {
                inFence = true;
                fenceChar = markerChar;
                fenceLength = marker.length;
            } else if (markerChar === fenceChar && marker.length >= fenceLength) {
                inFence = false;
                fenceChar = "";
                fenceLength = 0;
            }
        }

        const chunkLineCount = i - start + 1;
        const nextLine = lines[i + 1] || "";
        const softBoundary = !inFence && (
            line.trim() === "" ||
            /^#{1,6}\s+/.test(nextLine) ||
            isFenceLine(nextLine)
        );
        if (chunkLineCount >= CHUNKED_RENDER_TARGET_LINES && softBoundary) {
            pushChunk(i + 1);
        } else if (chunkLineCount >= CHUNKED_RENDER_MAX_LINES && !inFence) {
            pushChunk(i + 1);
        }
    }
    pushChunk(lines.length);
    return chunks.filter((chunk) => chunk.length > 0);
};

const createHtmlFragment = (html: string) => {
    const template = document.createElement("template");
    template.innerHTML = html;
    return template.content;
};

const renderRoughChunk = (chunk: string, index: number) => `
<div data-vditor-progressive-chunk="${index}" class="vditor-progressive-chunk" contenteditable="false" style="opacity:.72; contain:content;">
<pre style="white-space:pre-wrap; word-break:break-word; margin:0 0 12px; padding:0; font:inherit; line-height:1.7; color:var(--textarea-text-color, inherit);">${escapeHtml(chunk)}</pre>
</div>`;

const renderRoughPreview = (editorElement: HTMLElement, chunks: string[]) => {
    editorElement.innerHTML = chunks.map(renderRoughChunk).join("");
};

const replaceRoughChunk = (editorElement: HTMLElement, index: number, html: string) => {
    const fragment = createHtmlFragment(html);
    const placeholder = editorElement.querySelector(`[data-vditor-progressive-chunk="${index}"]`);
    if (placeholder) {
        placeholder.replaceWith(fragment);
        return;
    }
    editorElement.appendChild(fragment);
};

const processPreviewNodesInBatches = (
    nodes: HTMLElement[],
    each: (node: HTMLElement) => void,
    done: () => void,
) => {
    let index = 0;
    const step = () => {
        const deadline = performance.now() + ASYNC_BATCH_BUDGET_MS;
        while (index < nodes.length && performance.now() < deadline) {
            each(nodes[index]);
            index++;
        }
        if (index < nodes.length) {
            window.setTimeout(step, 0);
            return;
        }
        done();
    };
    window.setTimeout(step, 0);
};

const finishRender = (vditor: IVditor, editorElement: HTMLElement, options: {
    enableAddUndoStack: boolean;
    enableHint: boolean;
    enableInput: boolean;
}, sequence: number, deferCodeMirror: boolean) => {
    if (!isCurrentRender(vditor, sequence)) {
        return;
    }
    const previewNodes = Array.from(
        editorElement.querySelectorAll(".vditor-wysiwyg__preview[data-render='2']"),
    ) as HTMLElement[];
    processPreviewNodesInBatches(previewNodes, (item) => {
        const parent = item.parentElement as HTMLElement;
        if (!isCmCodeBlock(parent)) {
            processCodeRender(item, vditor);
        }
    }, () => {
        if (!isCurrentRender(vditor, sequence)) {
            return;
        }
        syncMathBlocksDisplayMode(editorElement, vditor);
        const mathPreviewNodes = Array.from(
            editorElement.querySelectorAll(".vditor-wysiwyg__block[data-type='math-block'] .vditor-wysiwyg__preview"),
        ) as HTMLElement[];
        processPreviewNodesInBatches(mathPreviewNodes, (preview) => {
            if (preview.getAttribute("data-render") !== "1") {
                processCodeRender(preview, vditor);
            }
        }, () => {
            if (!isCurrentRender(vditor, sequence)) {
                return;
            }
            if (deferCodeMirror) {
                ensureEditorBoundaryParagraphs(editorElement);
                editorElement.setAttribute("contenteditable", "true");
                editorElement.removeAttribute("data-async-rendering");
                editorElement.removeAttribute("data-progressive-rendering");
                renderToc(vditor);
                afterRenderEvent(vditor, options);
                renderCodeBlocksNearViewport(vditor);
            } else {
                renderCodeBlocks(vditor);
                ensureEditorBoundaryParagraphs(editorElement);
                editorElement.setAttribute("contenteditable", "true");
                editorElement.removeAttribute("data-async-rendering");
                editorElement.removeAttribute("data-progressive-rendering");
                renderToc(vditor);
                afterRenderEvent(vditor, options);
            }
        });
    });
};

const renderDomByMdChunked = (vditor: IVditor, md: string, options: {
    enableAddUndoStack: boolean;
    enableHint: boolean;
    enableInput: boolean;
}, sequence: number) => {
    const editorElement = vditor.wysiwyg.element;
    const chunks = splitMarkdownForChunkedRender(md);
    let index = 0;
    renderRoughPreview(editorElement, chunks);
    editorElement.setAttribute("contenteditable", "false");
    editorElement.setAttribute("data-async-rendering", "true");
    editorElement.setAttribute("data-progressive-rendering", "true");

    const step = () => {
        if (!isCurrentRender(vditor, sequence)) {
            return;
        }
        const deadline = performance.now() + ASYNC_BATCH_BUDGET_MS;
        while (index < chunks.length && performance.now() < deadline) {
            const html = vditor.lute.Md2VditorDOM(chunks[index]);
            log("Md2VditorDOM chunk", html, "result", vditor.options.debugger);
            replaceRoughChunk(editorElement, index, html);
            index++;
        }
        if (index < chunks.length) {
            window.setTimeout(step, 0);
            return;
        }
        finishRender(vditor, editorElement, options, sequence, true);
    };
    window.setTimeout(step, 0);
};

export const renderDomByMd = (vditor: IVditor, md: string, options = {
    enableAddUndoStack: true,
    enableHint: false,
    enableInput: true,
}) => {
    const sequence = nextRenderSequence(vditor);
    const editorElement = vditor.wysiwyg.element;

    if (shouldChunkRender(md)) {
        renderDomByMdChunked(vditor, md, options, sequence);
        return;
    }

    const html = vditor.lute.Md2VditorDOM(md);
    log("Md2VditorDOM", html, "result", vditor.options.debugger);
    editorElement.innerHTML = html;
    finishRender(vditor, editorElement, options, sequence, false);
};
