export interface SheetImageAnchor {
    col: number;
    row: number;
    width?: number;
    height?: number;
    brCol?: number;
    brRow?: number;
    editAs?: string;
}

export interface SheetImage {
    id: string;
    imageId: number;
    extension: 'jpeg' | 'png' | 'gif';
    base64: string;
    anchor: SheetImageAnchor;
}

export function sheetImageDataUrl(image: Pick<SheetImage, 'extension' | 'base64'>): string {
    return `data:image/${image.extension};base64,${image.base64}`;
}