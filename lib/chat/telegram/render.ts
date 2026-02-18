const TELEGRAM_CHUNK_LIMIT = 3900;

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');
}

export function stripHtmlTags(text: string): string {
    return decodeHtmlEntities(text.replace(/<[^>]+>/g, ''));
}

export function renderTelegramHtml(markdown: string): string {
    if (!markdown) return '';

    let text = markdown;
    const tokenMap = new Map<string, string>();
    let tokenIndex = 0;
    const nextToken = () => `@@TG_TOKEN_${tokenIndex++}@@`;

    text = text.replace(/\n?```(?:vega-lite|vega)\n([\s\S]*?)(?:```|$)\n?/gi, '');
    text = text.replace(/\n?<visualization\s+[^>]*\/>\n?/gi, '');

    text = text.replace(/```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g, (_match, _lang, code) => {
        const token = nextToken();
        tokenMap.set(token, `<pre><code>${escapeHtml(String(code).trim())}</code></pre>`);
        return token;
    });

    text = text.replace(/`([^`]+)`/g, (_match, code) => {
        const token = nextToken();
        tokenMap.set(token, `<code>${escapeHtml(String(code).trim())}</code>`);
        return token;
    });

    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_match, label, url) => {
        const token = nextToken();
        tokenMap.set(token, `<a href="${escapeHtml(String(url))}">${escapeHtml(String(label))}</a>`);
        return token;
    });

    text = escapeHtml(text);

    text = text.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>');
    text = text.replace(/^&gt;\s?(.+)$/gm, '<blockquote>$1</blockquote>');

    text = text.replace(/^\s*[-*]\s+/gm, '• ');
    text = text.replace(/^\s*(\d+)\.\s+/gm, '$1) ');

    text = text.replace(/\*\*\s*([\s\S]+?)\s*\*\*/g, '<b>$1</b>');
    text = text.replace(/__\s*([\s\S]+?)\s*__/g, '<b>$1</b>');
    text = text.replace(/(^|\s)\*\s*([\s\S]+?)\s*\*(?=\s|$|\W)/g, '$1<i>$2</i>');
    text = text.replace(/(^|\s)_\s*([\s\S]+?)\s*_(?=\s|$|\W)/g, '$1<i>$2</i>');

    for (const [token, html] of tokenMap.entries()) {
        text = text.replaceAll(token, html);
    }

    return text.replace(/\n{3,}/g, '\n\n').trim();
}

export function splitTelegramMessage(html: string): string[] {
    const normalized = html.trim();
    if (!normalized) return ['…'];
    if (normalized.length <= TELEGRAM_CHUNK_LIMIT) return [normalized];

    const chunks: string[] = [];
    const blocks = normalized.split(/\n{2,}/);
    let current = '';

    const pushCurrent = () => {
        if (current.trim()) chunks.push(current.trim());
        current = '';
    };

    const pushOversized = (block: string) => {
        let start = 0;
        while (start < block.length) {
            const slice = block.slice(start, start + TELEGRAM_CHUNK_LIMIT);
            chunks.push(slice);
            start += TELEGRAM_CHUNK_LIMIT;
        }
    };

    for (const block of blocks) {
        const candidate = current ? `${current}\n\n${block}` : block;
        if (candidate.length <= TELEGRAM_CHUNK_LIMIT) {
            current = candidate;
            continue;
        }

        if (current) pushCurrent();

        if (block.length <= TELEGRAM_CHUNK_LIMIT) {
            current = block;
            continue;
        }

        pushOversized(block);
    }

    pushCurrent();
    return chunks.length > 0 ? chunks : ['…'];
}