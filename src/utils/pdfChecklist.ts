import type { DepartmentTrack } from '../data/departments';

interface PdfLine {
  text: string;
  bold?: boolean;
  size?: number;
  spaceAfter?: number;
  colorRgb?: [number, number, number];
}

function sanitizePdfText(input: string): string {
  return input
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[•·]/g, '*')
    .replace(/×/g, 'x')
    .replace(/≈/g, '~')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function buildPdfDocument(lines: PdfLine[]): Blob {
  const pageWidth = 612;
  const pageHeight = 792;
  const marginX = 48;
  const topY = pageHeight - 52;
  const bottomMargin = 52;

  const pagesContent: string[] = [];
  let commands: string[] = [];
  let cursorY = topY;

  const flushPage = () => {
    if (commands.length > 0) {
      pagesContent.push(commands.join('\n'));
      commands = [];
    }
    cursorY = topY;
  };

  for (const item of lines) {
    const fontSize = item.size ?? 10;
    const lineHeight = Math.round(fontSize * 1.45);
    const maxChars = fontSize >= 14 ? 58 : fontSize >= 12 ? 70 : 86;
    const wrapped = wrapText(item.text, maxChars);

    for (const row of wrapped) {
      if (cursorY - lineHeight < bottomMargin) {
        flushPage();
      }
      const fontRef = item.bold ? '/F2' : '/F1';
      const [r, g, b] = item.colorRgb ?? [0.1, 0.1, 0.14];
      const safe = sanitizePdfText(row);
      commands.push(
        `BT ${fontRef} ${fontSize} Tf ${r.toFixed(2)} ${g.toFixed(
          2
        )} ${b.toFixed(2)} rg 1 0 0 1 ${marginX} ${cursorY} Tm (${safe}) Tj ET`
      );
      cursorY -= lineHeight;
    }

    cursorY -= item.spaceAfter ?? 3;
  }

  flushPage();
  if (pagesContent.length === 0) {
    pagesContent.push('BT /F1 11 Tf 0.1 0.1 0.1 rg 1 0 0 1 48 740 Tm (Empty Checklist) Tj ET');
  }

  const encoder = new TextEncoder();
  const objects: string[] = [];

  // 1: Catalog, 2: Pages (placeholder, updated below), 3: Helvetica, 4: Helvetica-Bold
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push(''); // placeholder for obj 2
  objects.push(
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  );
  objects.push(
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n'
  );

  const pageObjIds: number[] = [];
  let nextObjId = 5;

  for (const streamBody of pagesContent) {
    const contentObjId = nextObjId++;
    const pageObjId = nextObjId++;
    pageObjIds.push(pageObjId);

    const streamByteLen = encoder.encode(streamBody).length;
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${streamByteLen} >>\nstream\n${streamBody}\nendstream\nendobj\n`
    );
    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );
  }

  const kidsRef = pageObjIds.map((id) => `${id} 0 R`).join(' ');
  objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${kidsRef}] /Count ${pageObjIds.length} >>\nendobj\n`;

  const header = '%PDF-1.4\n';
  const chunks: Uint8Array[] = [encoder.encode(header)];
  let currentOffset = chunks[0].length;
  const offsets: number[] = [0]; // index 0 = free entry

  for (const objStr of objects) {
    offsets.push(currentOffset);
    const bytes = encoder.encode(objStr);
    chunks.push(bytes);
    currentOffset += bytes.length;
  }

  const xrefOffset = currentOffset;
  const xrefLines = [`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`];
  for (let i = 1; i <= objects.length; i++) {
    xrefLines.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(encoder.encode(xrefLines.join('') + trailer));

  const totalSize = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(totalSize);
  let pos = 0;
  for (const chunk of chunks) {
    merged.set(chunk, pos);
    pos += chunk.length;
  }

  return new Blob([merged], { type: 'application/pdf' });
}

export function downloadTrackChecklistPdf(
  track: DepartmentTrack,
  completedChecklistIds: string[],
  completedWeeklyTaskIds: string[]
): void {
  const lines: PdfLine[] = [
    {
      text: '#PGL.03 - Earning Guide by ArYan JAN BaLocH',
      bold: true,
      size: 11,
      colorRgb: [0.15, 0.39, 0.92],
      spaceAfter: 2,
    },
    {
      text: `${track.title} - Official Execution Checklist`,
      bold: true,
      size: 16,
      spaceAfter: 4,
    },
    {
      text: `Category: ${track.categoryLabel} | Level: ${track.level} | First Dollar Timeline: ${track.timeToFirstDollar}`,
      size: 9,
      colorRgb: [0.35, 0.35, 0.4],
      spaceAfter: 8,
    },
    {
      text: 'Summary & Earning Model',
      bold: true,
      size: 12,
      spaceAfter: 2,
    },
    {
      text: `${track.summary} Revenue Model: ${track.earningModel}`,
      size: 10,
      spaceAfter: 8,
    },
    {
      text: 'Step-by-Step SOP Action Checklist',
      bold: true,
      size: 12,
      colorRgb: [0.15, 0.39, 0.92],
      spaceAfter: 4,
    },
  ];

  for (const step of track.steps) {
    lines.push({
      text: `${step.stepNumber}. ${step.title} (${step.duration})`,
      bold: true,
      size: 11,
      spaceAfter: 2,
    });
    lines.push({
      text: `Objective: ${step.objective}`,
      size: 9,
      colorRgb: [0.25, 0.25, 0.32],
      spaceAfter: 2,
    });

    step.checklist.forEach((item, idx) => {
      const done = completedChecklistIds.includes(`${step.id}-chk-${idx}`);
      lines.push({
        text: `${done ? '[x]' : '[ ]'} ${item}`,
        size: 10,
        spaceAfter: 1,
      });
    });

    lines.push({
      text: `Deliverable: ${step.deliverable}`,
      size: 9,
      colorRgb: [0.06, 0.48, 0.35],
      spaceAfter: 6,
    });
  }

  lines.push({
    text: '4-Week Execution Milestones',
    bold: true,
    size: 12,
    colorRgb: [0.15, 0.39, 0.92],
    spaceAfter: 4,
  });

  track.weeklyMilestones.forEach((wk, wIdx) => {
    lines.push({
      text: `${wk.week}: ${wk.focusTitle} (Target: ${wk.targetMetric})`,
      bold: true,
      size: 10,
      spaceAfter: 2,
    });
    wk.tasks.forEach((task, tIdx) => {
      const done = completedWeeklyTaskIds.includes(
        `${track.id}-wk-${wIdx}-${tIdx}`
      );
      lines.push({
        text: `${done ? '[x]' : '[ ]'} ${task}`,
        size: 9,
        spaceAfter: 1,
      });
    });
    lines.push({ text: '', size: 4, spaceAfter: 2 });
  });

  lines.push({
    text: 'Monetization Benchmarks & Compliance Rules',
    bold: true,
    size: 12,
    colorRgb: [0.15, 0.39, 0.92],
    spaceAfter: 4,
  });

  for (const row of track.eligibility) {
    lines.push({
      text: `* ${row.metric}: ${row.requirement} - ${row.notes}`,
      size: 9,
      spaceAfter: 2,
    });
  }

  for (const warn of track.policyWarnings) {
    lines.push({
      text: `[Policy Alert] ${warn}`,
      size: 9,
      colorRgb: [0.65, 0.32, 0.05],
      spaceAfter: 2,
    });
  }

  lines.push({
    text: `Official Documentation: ${track.officialDocUrl}`,
    size: 9,
    colorRgb: [0.15, 0.39, 0.92],
    spaceAfter: 2,
  });

  const blob = buildPdfDocument(lines);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pgl03-${track.id}-sop-checklist.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
