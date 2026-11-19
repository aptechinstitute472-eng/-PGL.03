import { buildPdfDocument } from './pdfChecklist';

export interface InvoiceLineItem {
  description: string;
  qty: number;
  unitPriceUsd: number;
}

export interface InvoicePdfInput {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  senderName: string;
  senderEmailOrContact: string;
  clientName: string;
  clientCompany: string;
  items: InvoiceLineItem[];
  paymentInstructions: string;
  fxRate: number;
}

export interface ProposalPdfInput {
  proposalNumber: string;
  date: string;
  senderName: string;
  clientName: string;
  projectTitle: string;
  trackLabel: string;
  scopeSummary: string;
  deliverables: string[];
  timeline: string;
  totalUsd: number;
  paymentTerms: string;
}

export interface EnrollmentReceiptInput {
  ticketCode: string;
  date: string;
  planName: string;
  priceUsd: string;
  pricePkr: string;
  buyerName: string;
  buyerContact: string;
  preferredTrack: string;
  paymentMethod: string;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadClientInvoicePdf(input: InvoicePdfInput): void {
  const subtotal = input.items.reduce(
    (sum, item) => sum + Math.max(0, item.qty) * Math.max(0, item.unitPriceUsd),
    0
  );
  const totalUsd = Math.round(subtotal * 100) / 100;
  const totalPkr = Math.round(totalUsd * (input.fxRate || 278));

  const lines = [
    {
      text: 'INVOICE',
      bold: true,
      size: 18,
      colorRgb: [0.15, 0.39, 0.92] as [number, number, number],
      spaceAfter: 2,
    },
    {
      text: `Invoice #: ${input.invoiceNumber} | Issued: ${input.issueDate} | Due: ${input.dueDate}`,
      size: 10,
      colorRgb: [0.35, 0.35, 0.4] as [number, number, number],
      spaceAfter: 10,
    },
    {
      text: 'FROM (SERVICE PROVIDER)',
      bold: true,
      size: 10,
      colorRgb: [0.15, 0.39, 0.92] as [number, number, number],
      spaceAfter: 2,
    },
    {
      text: `${input.senderName} (${input.senderEmailOrContact})`,
      size: 10,
      spaceAfter: 8,
    },
    {
      text: 'BILL TO (CLIENT)',
      bold: true,
      size: 10,
      colorRgb: [0.15, 0.39, 0.92] as [number, number, number],
      spaceAfter: 2,
    },
    {
      text: input.clientCompany
        ? `${input.clientName} - ${input.clientCompany}`
        : input.clientName,
      size: 10,
      spaceAfter: 10,
    },
    {
      text: 'SERVICES & DELIVERABLES',
      bold: true,
      size: 11,
      colorRgb: [0.15, 0.39, 0.92] as [number, number, number],
      spaceAfter: 4,
    },
  ];

  input.items.forEach((item, idx) => {
    const lineTotal = Math.round(item.qty * item.unitPriceUsd * 100) / 100;
    lines.push({
      text: `${idx + 1}. ${item.description}  |  Qty: ${item.qty}  x  $${item.unitPriceUsd.toFixed(
        2
      )}  =  $${lineTotal.toFixed(2)} USD`,
      size: 10,
      spaceAfter: 3,
    });
  });

  lines.push(
    {
      text: '--------------------------------------------------------------------',
      size: 9,
      colorRgb: [0.5, 0.5, 0.55] as [number, number, number],
      spaceAfter: 4,
    },
    {
      text: `TOTAL DUE: $${totalUsd.toLocaleString()} USD (Approx. Rs. ${totalPkr.toLocaleString()} PKR)`,
      bold: true,
      size: 13,
      colorRgb: [0.06, 0.48, 0.35] as [number, number, number],
      spaceAfter: 10,
    },
    {
      text: 'PAYMENT INSTRUCTIONS',
      bold: true,
      size: 10,
      colorRgb: [0.15, 0.39, 0.92] as [number, number, number],
      spaceAfter: 2,
    },
    {
      text: input.paymentInstructions,
      size: 10,
      spaceAfter: 8,
    },
    {
      text: 'Generated via #PGL.03 Earning Guide by ArYan JAN BaLocH',
      size: 8,
      colorRgb: [0.45, 0.45, 0.5] as [number, number, number],
      spaceAfter: 2,
    }
  );

  const blob = buildPdfDocument(lines);
  triggerBlobDownload(blob, `invoice-${input.invoiceNumber.toLowerCase()}.pdf`);
}

export function downloadClientProposalPdf(input: ProposalPdfInput): void {
  const lines = [
    {
      text: 'CLIENT PROJECT PROPOSAL',
      bold: true,
      size: 18,
      colorRgb: [0.15, 0.39, 0.92] as [number, number, number],
      spaceAfter: 2,
    },
    {
      text: `Proposal #: ${input.proposalNumber} | Date: ${input.date} | Track: ${input.trackLabel}`,
      size: 10,
      colorRgb: [0.35, 0.35, 0.4] as [number, number, number],
      spaceAfter: 10,
    },
    {
      text: input.projectTitle,
      bold: true,
      size: 14,
      spaceAfter: 4,
    },
    {
      text: `Prepared for: ${input.clientName} | Prepared by: ${input.senderName}`,
      size: 10,
      colorRgb: [0.25, 0.25, 0.32] as [number, number, number],
      spaceAfter: 10,
    },
    {
      text: 'PROJECT SCOPE & OBJECTIVE',
      bold: true,
      size: 11,
      colorRgb: [0.15, 0.39, 0.92] as [number, number, number],
      spaceAfter: 3,
    },
    {
      text: input.scopeSummary,
      size: 10,
      spaceAfter: 8,
    },
    {
      text: 'INCLUDED DELIVERABLES',
      bold: true,
      size: 11,
      colorRgb: [0.15, 0.39, 0.92] as [number, number, number],
      spaceAfter: 3,
    },
  ];

  input.deliverables.forEach((deliv, idx) => {
    lines.push({
      text: `${idx + 1}. ${deliv}`,
      size: 10,
      spaceAfter: 2,
    });
  });

  lines.push(
    {
      text: 'TIMELINE & INVESTMENT',
      bold: true,
      size: 11,
      colorRgb: [0.15, 0.39, 0.92] as [number, number, number],
      spaceAfter: 3,
    },
    {
      text: `Delivery Timeline: ${input.timeline}`,
      size: 10,
      spaceAfter: 2,
    },
    {
      text: `Total Investment: $${input.totalUsd.toLocaleString()} USD`,
      bold: true,
      size: 12,
      colorRgb: [0.06, 0.48, 0.35] as [number, number, number],
      spaceAfter: 3,
    },
    {
      text: `Payment Terms: ${input.paymentTerms}`,
      size: 10,
      spaceAfter: 10,
    },
    {
      text: 'Prepared with #PGL.03 Earning Guide by ArYan JAN BaLocH',
      size: 8,
      colorRgb: [0.45, 0.45, 0.5] as [number, number, number],
      spaceAfter: 2,
    }
  );

  const blob = buildPdfDocument(lines);
  triggerBlobDownload(blob, `proposal-${input.proposalNumber.toLowerCase()}.pdf`);
}

export function downloadEnrollmentReceiptPdf(
  input: EnrollmentReceiptInput
): void {
  const blob = buildPdfDocument([
    {
      text: '#PGL.03 - Register for Earning Confirmation',
      bold: true,
      size: 15,
      colorRgb: [0.15, 0.39, 0.92],
      spaceAfter: 4,
    },
    {
      text: 'Earning Guide by ArYan JAN BaLocH',
      size: 10,
      colorRgb: [0.35, 0.35, 0.4],
      spaceAfter: 10,
    },
    {
      text: `Ticket Code: ${input.ticketCode}`,
      bold: true,
      size: 12,
      colorRgb: [0.06, 0.48, 0.35],
      spaceAfter: 4,
    },
    {
      text: `Date: ${input.date}`,
      size: 10,
      spaceAfter: 8,
    },
    {
      text: `Selected Plan: ${input.planName} (${input.priceUsd} / ${input.pricePkr})`,
      bold: true,
      size: 11,
      spaceAfter: 4,
    },
    {
      text: `Applicant Name: ${input.buyerName}`,
      size: 10,
      spaceAfter: 2,
    },
    {
      text: `Contact (WhatsApp / Email): ${input.buyerContact}`,
      size: 10,
      spaceAfter: 2,
    },
    {
      text: `Primary Focus Track: ${input.preferredTrack}`,
      size: 10,
      spaceAfter: 2,
    },
    {
      text: `Payment Method: ${input.paymentMethod}`,
      size: 10,
      spaceAfter: 8,
    },
  ]);

  triggerBlobDownload(
    blob,
    `pgl03-enrollment-${input.ticketCode.toLowerCase()}.pdf`
  );
}
