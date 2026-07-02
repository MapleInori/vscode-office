export const setLute = (options: ILuteOptions) => {
    const lute: Lute = Lute.New();
    lute.SetHeadingAnchor(options.headingAnchor);
    lute.SetInlineMathAllowDigitAfterOpenMarker(options.inlineMathDigit);
    lute.SetToC(options.toc);
    lute.SetVditorCodeBlockPreview(options.codeBlockPreview);
    lute.SetVditorMathBlockPreview(options.mathBlockPreview);
    lute.SetSanitize(options.sanitize);
    lute.SetChineseParagraphBeginningSpace(options.paragraphBeginningSpace);
    lute.SetRenderListStyle(options.listStyle);
    lute.SetLinkBase(options.linkBase);
    lute.SetLinkPrefix(options.linkPrefix);
    lute.SetMark(options.mark);
    if (options.lazyLoadImage) {
        lute.SetImageLazyLoading(options.lazyLoadImage);
    }
    return lute;
};
