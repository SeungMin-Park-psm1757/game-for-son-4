const CELL = 16;

type PixelRect = [number, number, number?, number?];
type PixelLayer = {
    fill: string;
    rects: PixelRect[];
};

function rectToSvg([x, y, w = 1, h = 1]: PixelRect) {
    return `<rect x="${x * CELL}" y="${y * CELL}" width="${w * CELL}" height="${h * CELL}" />`;
}

function buildPixelIcon(layers: PixelLayer[]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" shape-rendering="crispEdges">${layers
        .map((layer) => `<g fill="${layer.fill}">${layer.rects.map(rectToSvg).join('')}</g>`)
        .join('')}</svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const PIXEL_ICON_URLS: Record<string, string> = {
    'dock-feed': buildPixelIcon([
        { fill: '#5b9e4d', rects: [[13, 4, 2, 22], [16, 7, 2, 16]] },
        { fill: '#8fdc6b', rects: [[8, 8, 6, 6], [6, 12, 7, 6], [8, 16, 6, 5], [17, 8, 7, 6], [18, 14, 7, 6], [17, 20, 5, 4]] },
        { fill: '#c5f59a', rects: [[10, 10, 3, 2], [19, 10, 3, 2], [9, 18, 3, 2], [20, 16, 3, 2]] },
    ]),
    'dock-train': buildPixelIcon([
        { fill: '#0f172a', rects: [[9, 5, 14, 2], [7, 7, 18, 2], [5, 9, 22, 2], [4, 11, 24, 10], [5, 21, 22, 2], [7, 23, 18, 2], [9, 25, 14, 2]] },
        { fill: '#f8fafc', rects: [[10, 7, 12, 2], [8, 9, 16, 2], [7, 11, 5, 4], [15, 11, 2, 4], [20, 11, 5, 4], [8, 15, 3, 4], [13, 15, 6, 6], [21, 15, 3, 4], [10, 21, 12, 2], [12, 23, 8, 2]] },
        { fill: '#111827', rects: [[14, 13, 4, 4], [11, 19, 3, 3], [18, 19, 3, 3], [9, 15, 2, 2], [21, 15, 2, 2]] },
    ]),
    'dock-sleep': buildPixelIcon([
        { fill: '#f5c453', rects: [[16, 5, 8, 2], [13, 7, 11, 2], [11, 9, 11, 2], [10, 11, 9, 2], [9, 13, 8, 2], [9, 15, 7, 2], [10, 17, 6, 2], [12, 19, 6, 2], [14, 21, 6, 2], [18, 23, 5, 2], [21, 25, 3, 2]] },
        { fill: '#fde68a', rects: [[18, 7, 4, 2], [15, 9, 4, 2], [13, 11, 3, 2], [12, 13, 2, 2], [13, 15, 2, 2], [15, 17, 2, 2], [17, 19, 2, 2]] },
    ]),
    'dock-wash': buildPixelIcon([
        { fill: '#7c8aa5', rects: [[10, 6, 10, 2], [18, 8, 4, 2], [20, 10, 2, 4], [8, 12, 12, 2], [7, 14, 4, 2], [6, 16, 3, 2]] },
        { fill: '#cdd9f3', rects: [[9, 8, 8, 2], [8, 10, 10, 2], [9, 14, 4, 2]] },
        { fill: '#7dd3fc', rects: [[18, 15, 2, 3], [15, 18, 2, 3], [21, 18, 2, 3], [13, 21, 2, 3], [19, 22, 2, 3]] },
    ]),
    'dock-shop': buildPixelIcon([
        { fill: '#64748b', rects: [[6, 8, 20, 2], [8, 10, 16, 2], [10, 12, 13, 2], [11, 14, 11, 2], [12, 16, 9, 2], [13, 18, 8, 2], [9, 20, 12, 2], [8, 22, 13, 2]] },
        { fill: '#94a3b8', rects: [[7, 24, 12, 2], [18, 24, 3, 2], [9, 6, 5, 2]] },
        { fill: '#b45309', rects: [[9, 26, 3, 2], [18, 26, 3, 2]] },
        { fill: '#334155', rects: [[8, 28, 4, 2], [17, 28, 4, 2]] },
    ]),
    'dock-interact': buildPixelIcon([
        { fill: '#c4b5fd', rects: [[7, 8, 18, 2], [5, 10, 22, 2], [4, 12, 24, 10], [5, 22, 18, 2], [10, 24, 5, 2], [8, 26, 3, 2]] },
        { fill: '#8b5cf6', rects: [[10, 12, 3, 3], [15, 12, 3, 3], [20, 12, 3, 3]] },
        { fill: '#ede9fe', rects: [[8, 10, 16, 2], [6, 12, 20, 8], [7, 20, 15, 2]] },
    ]),
    train_ball: buildPixelIcon([
        { fill: '#0f172a', rects: [[9, 5, 14, 2], [7, 7, 18, 2], [5, 9, 22, 2], [4, 11, 24, 10], [5, 21, 22, 2], [7, 23, 18, 2], [9, 25, 14, 2]] },
        { fill: '#f8fafc', rects: [[10, 7, 12, 2], [8, 9, 16, 2], [7, 11, 5, 4], [15, 11, 2, 4], [20, 11, 5, 4], [8, 15, 3, 4], [13, 15, 6, 6], [21, 15, 3, 4], [10, 21, 12, 2], [12, 23, 8, 2]] },
        { fill: '#111827', rects: [[14, 13, 4, 4], [11, 19, 3, 3], [18, 19, 3, 3], [9, 15, 2, 2], [21, 15, 2, 2]] },
    ]),
    train_frisbee: buildPixelIcon([
        { fill: '#2563eb', rects: [[9, 8, 14, 2], [7, 10, 18, 2], [5, 12, 22, 2], [4, 14, 24, 5], [5, 19, 22, 2], [7, 21, 18, 2], [9, 23, 14, 2]] },
        { fill: '#7dd3fc', rects: [[10, 10, 12, 2], [8, 12, 16, 2], [7, 14, 18, 2], [8, 16, 16, 2], [10, 18, 12, 2], [12, 20, 8, 2]] },
        { fill: '#e0f2fe', rects: [[12, 12, 8, 2], [10, 14, 12, 2], [11, 16, 10, 2], [13, 18, 6, 2]] },
    ]),
    train_discipline: buildPixelIcon([
        { fill: '#dbe4ec', rects: [[6, 23, 6, 3], [8, 20, 6, 3], [10, 17, 6, 3], [12, 14, 6, 3], [14, 11, 6, 3], [16, 8, 6, 3], [18, 5, 6, 3]] },
        { fill: '#64748b', rects: [[5, 24, 8, 2], [7, 21, 8, 2], [9, 18, 8, 2], [11, 15, 8, 2], [13, 12, 8, 2], [15, 9, 8, 2], [17, 6, 8, 2]] },
        { fill: '#94a3b8', rects: [[9, 22, 1, 2], [11, 19, 1, 2], [13, 16, 1, 2], [15, 13, 1, 2], [17, 10, 1, 2], [19, 7, 1, 2]] },
    ]),
    train_walk: buildPixelIcon([
        { fill: '#6f4b3c', rects: [[7, 11, 4, 4], [12, 8, 4, 5], [17, 8, 4, 5], [22, 11, 4, 4], [10, 16, 13, 7], [9, 23, 4, 3], [20, 23, 4, 3]] },
        { fill: '#8a5a48', rects: [[11, 17, 11, 5], [13, 22, 7, 2], [14, 24, 5, 1]] },
    ]),
    train_sing: buildPixelIcon([
        { fill: '#7c3aed', rects: [[18, 5, 3, 15], [16, 20, 6, 2], [11, 21, 8, 2], [10, 23, 7, 2], [9, 25, 6, 2], [8, 27, 4, 2]] },
        { fill: '#c4b5fd', rects: [[11, 18, 8, 2], [9, 20, 9, 2], [7, 22, 8, 2], [6, 24, 6, 2], [6, 26, 4, 2], [20, 10, 6, 2], [22, 12, 4, 2], [23, 14, 2, 2]] },
    ]),
    train_dance: buildPixelIcon([
        { fill: '#ef4444', rects: [[15, 6, 3, 4], [14, 10, 5, 3], [12, 13, 9, 3], [10, 16, 5, 3], [18, 16, 4, 3], [9, 19, 5, 3], [19, 19, 5, 3], [8, 22, 6, 3], [18, 22, 6, 3]] },
        { fill: '#fca5a5', rects: [[12, 8, 2, 2], [19, 8, 2, 2], [13, 25, 2, 3], [18, 25, 2, 3]] },
        { fill: '#7f1d1d', rects: [[10, 26, 2, 3], [21, 26, 2, 3], [15, 29, 2, 2], [17, 29, 2, 2]] },
    ]),
    sleep_floor: buildPixelIcon([
        { fill: '#64748b', rects: [[6, 18, 20, 2], [7, 20, 18, 2], [8, 22, 16, 2], [9, 24, 14, 2]] },
        { fill: '#cbd5e1', rects: [[8, 14, 6, 4], [14, 16, 8, 4]] },
        { fill: '#f5c453', rects: [[22, 7, 4, 2], [20, 9, 6, 2], [18, 11, 6, 2], [17, 13, 5, 2], [16, 15, 4, 2]] },
    ]),
    sleep_outside: buildPixelIcon([
        { fill: '#1d4ed8', rects: [[8, 17, 16, 2], [10, 19, 12, 2], [12, 21, 8, 2]] },
        { fill: '#f59e0b', rects: [[14, 9, 4, 8], [12, 11, 8, 4]] },
        { fill: '#475569', rects: [[15, 17, 2, 8], [9, 25, 14, 2]] },
        { fill: '#f8fafc', rects: [[6, 8, 2, 2], [24, 10, 2, 2], [22, 6, 1, 1], [9, 6, 1, 1]] },
    ]),
    sleep_bed: buildPixelIcon([
        { fill: '#7c4a32', rects: [[7, 12, 18, 2], [7, 14, 2, 10], [23, 14, 2, 10], [9, 22, 14, 2]] },
        { fill: '#fca5a5', rects: [[9, 14, 14, 6], [10, 20, 12, 2]] },
        { fill: '#e2e8f0', rects: [[9, 16, 5, 4]] },
    ]),
};

export function getActionIconUrl(key: string) {
    return PIXEL_ICON_URLS[key] ?? '';
}

export function getActionIconMarkup(key: string, fallbackEmoji: string, className: string) {
    const url = getActionIconUrl(key);
    if (!url) return `<span aria-hidden="true">${fallbackEmoji}</span>`;
    return `<img src="${url}" alt="" aria-hidden="true" class="${className}" />`;
}
