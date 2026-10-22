// Render the documentation's small Mermaid DAGs as offline SVGs, without browser JS.
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function wrap(text, limit) {
  const lines = [''];
  for (const word of text.split(/\s+/)) {
    const last = lines.length - 1;
    if (lines[last] && lines[last].length + word.length + 1 > limit) lines.push(word);
    else lines[last] += (lines[last] ? ' ' : '') + word;
  }
  return lines;
}

function textLines(lines, x, y, size, color) {
  const step = size + 4;
  return `<text text-anchor="middle" font-family="system-ui, sans-serif" font-size="${size}" fill="${color}">${lines.map((line, i) => `<tspan x="${x}" y="${y + (i - (lines.length - 1) / 2) * step + size / 3}">${escape(line)}</tspan>`).join('')}</text>`;
}

export function renderDiagram(source, { id, title }) {
  const lines = source.split('\n').map(line => line.trim()).filter(Boolean);
  const direction = lines.shift()?.match(/^flowchart (LR|TD|TB)$/)?.[1];
  if (!direction) throw Error('Diagram must start with flowchart LR, TD or TB');
  const nodes = new Map(), edges = [];
  const node = (key, label) => {
    if (!nodes.has(key)) nodes.set(key, { key, label: label ?? key, rank: 0, incoming: 0, outgoing: [] });
    else if (label) nodes.get(key).label = label;
  };
  for (const line of lines) {
    const match = line.match(/^(\w+)(?:\[([^\]]+)\])?\s*-->(?:\|([^|]+)\|)?\s*(\w+)(?:\[([^\]]+)\])?$/);
    if (!match) throw Error(`Unsupported flow syntax: ${line}`);
    const [, from, fromLabel, label = '', to, toLabel] = match;
    node(from, fromLabel); node(to, toLabel);
    edges.push({ from, to, label });
    nodes.get(from).outgoing.push(to);
    nodes.get(to).incoming++;
  }
  if (!nodes.size) throw Error('Diagram must contain an edge');
  const pending = new Map([...nodes].map(([key, value]) => [key, value.incoming]));
  const queue = [...nodes.values()].filter(value => !value.incoming);
  for (let i = 0; i < queue.length; i++) {
    for (const key of queue[i].outgoing) {
      const next = nodes.get(key);
      next.rank = Math.max(next.rank, queue[i].rank + 1);
      pending.set(key, pending.get(key) - 1);
      if (!pending.get(key)) queue.push(next);
    }
  }
  if (queue.length !== nodes.size) throw Error('Documentation diagrams must be acyclic');
  const levels = Array.from({ length: Math.max(...queue.map(value => value.rank)) + 1 }, () => []);
  for (const value of nodes.values()) levels[value.rank].push(value);
  const horizontal = direction === 'LR';
  const boxWidth = 230, boxHeight = 84, padding = 32;
  const gap = horizontal ? 220 : 76, laneGap = 40;
  const lanes = Math.max(...levels.map(level => level.length));
  const width = Math.max(560, padding * 2 + (horizontal
    ? levels.length * boxWidth + (levels.length - 1) * gap
    : lanes * boxWidth + (lanes - 1) * laneGap));
  const height = padding * 2 + (horizontal
    ? lanes * boxHeight + (lanes - 1) * laneGap
    : levels.length * boxHeight + (levels.length - 1) * gap);
  for (const [rank, level] of levels.entries()) {
    for (const [lane, value] of level.entries()) {
      value.x = horizontal ? padding + rank * (boxWidth + gap)
        : (width - level.length * boxWidth - (level.length - 1) * laneGap) / 2 + lane * (boxWidth + laneGap);
      value.y = horizontal
        ? (height - level.length * boxHeight - (level.length - 1) * laneGap) / 2 + lane * (boxHeight + laneGap)
        : padding + rank * (boxHeight + gap);
      value.lines = wrap(value.label, 27);
      if (value.lines.length > 3) throw Error(`Shorten diagram node label: ${value.label}`);
    }
  }
  const marker = escape(`${id}-arrow`), titleId = escape(`${id}-title`);
  const paths = [], labels = [];
  for (const edge of edges) {
    const from = nodes.get(edge.from), to = nodes.get(edge.to);
    const x1 = from.x + (horizontal ? boxWidth : boxWidth / 2);
    const y1 = from.y + (horizontal ? boxHeight / 2 : boxHeight);
    const x2 = to.x + (horizontal ? 0 : boxWidth / 2);
    const y2 = to.y + (horizontal ? boxHeight / 2 : 0);
    const middleX = (x1 + x2) / 2, middleY = (y1 + y2) / 2;
    const curve = horizontal ? `${middleX} ${y1}, ${middleX} ${y2}, ${x2} ${y2}`
      : `${x1} ${middleY}, ${x2} ${middleY}, ${x2} ${y2}`;
    paths.push(`<path d="M ${x1} ${y1} C ${curve}" fill="none" stroke="#79cfb4" stroke-width="2" marker-end="url(#${marker})"/>`);
    if (edge.label) {
      const lines = wrap(edge.label, 26), labelHeight = lines.length * 16 + 12;
      if (lines.length > 3) throw Error(`Shorten diagram edge label: ${edge.label}`);
      // Keep labels in their source lanes where two inputs merge.
      const labelX = !horizontal && to.incoming > 1 ? x1 : middleX;
      labels.push(`<g><rect x="${labelX - 100}" y="${middleY - labelHeight / 2}" width="200" height="${labelHeight}" rx="6" fill="#101b2a"/>${textLines(lines, labelX, middleY, 12, '#a8e8d2')}</g>`);
    }
  }
  const boxes = [...nodes.values()].map(value => {
    const color = !value.incoming ? '#7edec0' : !value.outgoing.length ? '#b3a4ed' : '#7eadd5';
    return `<g><rect x="${value.x}" y="${value.y}" width="${boxWidth}" height="${boxHeight}" rx="12" fill="#152337" stroke="${color}" stroke-width="1.5"/>${textLines(value.lines, value.x + boxWidth / 2, value.y + boxHeight / 2, 14, '#edf4ff')}</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${titleId}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><title id="${titleId}">${escape(title)}</title><defs><marker id="${marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#79cfb4" stroke-width="1.5"/></marker></defs><rect width="${width}" height="${height}" rx="16" fill="#101b2a"/>${paths.join('')}${labels.join('')}${boxes.join('')}</svg>`;
}
