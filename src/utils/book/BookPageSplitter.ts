import { PAGE_WIDTH, PAGE_CONTENT_HEIGHT, PAGE_CONTENT_WIDTH } from '../../components/campaign/constants';
import { logger } from '../logger';

const BUDGET_BUFFER = 0; // Removing safety margin to match editor exactly

/**
 * Creates an HTMLElement from an HTML string.
 */
function createElementFromHtml(html: string): HTMLElement {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return (template.content.firstElementChild as HTMLElement) || document.createElement('div');
}

/**
 * Measures the total height of a set of HTML blocks as they would appear on a page.
 * Crucial: Includes margin collapse and uses the same typography context.
 */
function measureContentHeight(htmls: string[]): number {
    const temp = document.createElement('div');
    temp.className = 'book-page-content';
    temp.style.width = `${PAGE_WIDTH}px`;
    temp.style.padding = '0'; // Remove padding to allow margin collapse matching scrollHeight
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.top = '0';
    temp.style.left = '-9999px';
    temp.innerHTML = htmls.join('');
    document.body.appendChild(temp);

    // No padding subtraction needed
    const height = temp.offsetHeight;
    document.body.removeChild(temp);
    return height;
}

/**
 * Splits HTML content into pages of fixed height.
 */
export function splitIntoPages(html: string, pageHeight: number = PAGE_CONTENT_HEIGHT): string[] {
    if (!html || html.trim() === '' || html === '<p></p>') {
        return ['<p style="color:#94a3b8;font-style:italic;">Page vide</p>'];
    }

    const targetHeight = pageHeight - BUDGET_BUFFER;

    // Step 1: Parse HTML into separate blocks
    const parser = document.createElement('div');
    parser.innerHTML = html;
    const blockElements = Array.from(parser.children) as HTMLElement[];

    interface Block {
        html: string;
        isSplittable: boolean;
        isChapterHeader: boolean;
    }

    const blocks: Block[] = blockElements.map(el => ({
        html: el.outerHTML,
        isSplittable: !el.tagName.toLowerCase().startsWith('h') &&
            !el.classList.contains('chapter-header-wrapper') &&
            el.tagName.toLowerCase() !== 'figure' &&
            el.querySelector('img') === null,
        isChapterHeader: el.classList.contains('chapter-header-wrapper')
    }));

    // Step 2: Distribute into pages
    const pages: string[] = [];
    let currentPageBlocks: string[] = [];
    let blockQueue: Block[] = [...blocks];

    while (blockQueue.length > 0) {
        const block = blockQueue.shift()!;

        // Rule: Chapter headers always start a new page
        if (block.isChapterHeader && currentPageBlocks.length > 0) {
            pages.push(currentPageBlocks.join(''));
            currentPageBlocks = [];
        }

        const heightWithNewBlock = measureContentHeight([...currentPageBlocks, block.html]);

        if (heightWithNewBlock <= targetHeight) {
            currentPageBlocks.push(block.html);
        } else {
            // Block doesn't fit
            if (block.isSplittable) {
                // Try to split it
                const remainingSpace = targetHeight - measureContentHeight(currentPageBlocks);

                // If we have literally no space left, just move to next page
                if (remainingSpace < 10 && currentPageBlocks.length > 0) {
                    pages.push(currentPageBlocks.join(''));
                    currentPageBlocks = [];
                    blockQueue.unshift(block);
                    continue;
                }

                const splitResult = splitParagraph(block.html, targetHeight, currentPageBlocks);

                if (splitResult.firstPart) {
                    currentPageBlocks.push(splitResult.firstPart);
                    pages.push(currentPageBlocks.join(''));
                    currentPageBlocks = [];

                    if (splitResult.remainingParts.length > 0) {
                        const remainingBlocks: Block[] = splitResult.remainingParts.map(h => ({
                            html: h,
                            isSplittable: true,
                            isChapterHeader: false
                        }));
                        blockQueue.unshift(...remainingBlocks);
                    }
                } else {
                    // Cannot split even a bit, move whole block to next page
                    if (currentPageBlocks.length > 0) {
                        pages.push(currentPageBlocks.join(''));
                        currentPageBlocks = [];
                        blockQueue.unshift(block);
                    } else {
                        // Page is empty but block still doesn't fit? Force it to avoid loop
                        currentPageBlocks.push(block.html);
                        pages.push(currentPageBlocks.join(''));
                        currentPageBlocks = [];
                    }
                }
            } else {
                // Not splittable (heading, image, etc.)
                if (currentPageBlocks.length > 0) {
                    pages.push(currentPageBlocks.join(''));
                    currentPageBlocks = [];
                    blockQueue.unshift(block);
                } else {
                    // Force non-splittable block on empty page
                    currentPageBlocks.push(block.html);
                    pages.push(currentPageBlocks.join(''));
                    currentPageBlocks = [];
                }
            }
        }
    }

    if (currentPageBlocks.length > 0) {
        pages.push(currentPageBlocks.join(''));
    }

    logger.info(`[BookPageSplitter] Created ${pages.length} pages.`);
    return pages.length > 0 ? pages : ['<p style="color:#94a3b8;font-style:italic;">Page vide</p>'];
}

/**
 * Splits a paragraph into two parts.
 * Uses Binary Search for performance and cumulative measurement for accuracy.
 */
function splitParagraph(
    blockHtml: string,
    targetHeight: number,
    existingHtml: string[]
): { firstPart: string | null; remainingParts: string[] } {
    const element = createElementFromHtml(blockHtml);
    const text = element.textContent || '';

    if (text.length < 1) return { firstPart: null, remainingParts: [blockHtml] };

    // Split into tokens (preserving spaces)
    const tokens = text.split(/(\s+)/);

    // We'll use a single container for multiple measurements
    const measureContainer = document.createElement('div');
    measureContainer.className = 'book-page-content';
    measureContainer.style.width = `${PAGE_WIDTH}px`;
    measureContainer.style.padding = '0';
    measureContainer.style.position = 'absolute';
    measureContainer.style.visibility = 'hidden';
    measureContainer.style.top = '0';
    measureContainer.style.left = '-9999px';
    document.body.appendChild(measureContainer);

    // Context from previous blocks on the same page
    const prefixHtml = existingHtml.join('');

    // Range-based splitting helper
    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'book-page-content';
    sourceDiv.style.width = `${PAGE_WIDTH}px`;
    sourceDiv.style.position = 'absolute';
    sourceDiv.style.left = '-9999px';
    sourceDiv.innerHTML = blockHtml;
    document.body.appendChild(sourceDiv);
    const sourceEl = sourceDiv.firstElementChild as HTMLElement;

    function getTextNodes(el: Node): { node: Text; start: number; end: number }[] {
        const nodes: { node: Text; start: number; end: number }[] = [];
        let offset = 0;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode() as Text) {
            const len = node.textContent?.length || 0;
            nodes.push({ node, start: offset, end: offset + len });
            offset += len;
        }
        return nodes;
    }

    const textNodes = getTextNodes(sourceEl);

    function measureWithChars(charCount: number): number {
        if (charCount <= 0) return measureContentHeight(existingHtml);

        const endInfo = textNodes.find(n => charCount <= n.end) || textNodes[textNodes.length - 1];
        const offsetInNode = Math.min(charCount - endInfo.start, endInfo.node.textContent?.length || 0);

        const range = document.createRange();
        range.setStart(textNodes[0].node, 0);
        range.setEnd(endInfo.node, Math.max(0, offsetInNode));

        const frag = range.cloneContents();
        const wrap = sourceEl.cloneNode(false) as HTMLElement;
        wrap.appendChild(frag);

        measureContainer.innerHTML = prefixHtml + wrap.outerHTML;
        return measureContainer.offsetHeight;
    }

    // Binary search for the split point
    let low = 0;
    let high = tokens.length;
    let bestTokenIndex = 0;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const charCount = tokens.slice(0, mid).join('').length;
        const height = measureWithChars(charCount);

        if (height <= targetHeight) {
            bestTokenIndex = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    const finalCharCount = tokens.slice(0, bestTokenIndex).join('').length;
    let result: { firstPart: string | null; remainingParts: string[] };

    if (finalCharCount > 0 && finalCharCount < text.length) {
        // Build parts using the final char count
        const endInfo = textNodes.find(n => finalCharCount <= n.end)!;

        const r1 = document.createRange();
        r1.setStart(textNodes[0].node, 0);
        r1.setEnd(endInfo.node, finalCharCount - endInfo.start);
        const w1 = sourceEl.cloneNode(false) as HTMLElement;
        w1.appendChild(r1.cloneContents());

        const r2 = document.createRange();
        r2.setStart(endInfo.node, finalCharCount - endInfo.start);
        r2.setEndAfter(sourceEl.lastChild!);
        const w2 = sourceEl.cloneNode(false) as HTMLElement;
        w2.appendChild(r2.cloneContents());

        result = { firstPart: w1.outerHTML, remainingParts: [w2.outerHTML] };
    } else {
        result = { firstPart: null, remainingParts: [blockHtml] };
    }

    document.body.removeChild(measureContainer);
    document.body.removeChild(sourceDiv);
    return result;
}
