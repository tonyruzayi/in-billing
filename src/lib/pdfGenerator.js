import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const COMPANY = {
  name: 'Information Networking',
  address: 'Plot 143 Seorome Ward',
  city: 'Palapye, Botswana',
  phone: '+267 76 173 945',
  email: 'info@in-networking.com',
  vat: 'BW00000495441',
  tagline: 'Connecting Innovation, Empowering Networks',
};

const C = {
  dark:      [26, 26, 46],
  purple:    [139, 92, 246],
  cyan:      [34, 211, 238],
  white:     [255, 255, 255],
  gray:      [100, 100, 120],
  lightGray: [240, 240, 248],
};

function fmtDate(d) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch (e) { return d; }
}

function fmtAmt(n) {
  return 'BWP ' + Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2 });
}

function drawHeader(doc, type) {
  const pw = doc.internal.pageSize.width;
  doc.setFillColor(C.dark[0], C.dark[1], C.dark[2]);
  doc.rect(0, 0, pw, 42, 'F');
  doc.setFillColor(C.purple[0], C.purple[1], C.purple[2]);
  doc.rect(0, 38, pw, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(C.white[0], C.white[1], C.white[2]);
  doc.text(COMPANY.name.toUpperCase(), 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(C.cyan[0], C.cyan[1], C.cyan[2]);
  doc.text(COMPANY.tagline.toUpperCase(), 14, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(C.white[0], C.white[1], C.white[2]);
  doc.text(type, pw - 14, 22, { align: 'right' });
  return 50;
}

function drawFromTo(doc, data, y, isInvoice) {
  const pw = doc.internal.pageSize.width;
  const col2 = pw / 2 + 4;
  doc.setFillColor(C.lightGray[0], C.lightGray[1], C.lightGray[2]);
  doc.roundedRect(10, y, pw / 2 - 14, 52, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(C.purple[0], C.purple[1], C.purple[2]);
  doc.text('FROM', 16, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
  doc.text(COMPANY.name, 16, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(C.gray[0], C.gray[1], C.gray[2]);
  doc.text(COMPANY.address, 16, y + 23);
  doc.text(COMPANY.city, 16, y + 29);
  doc.text(COMPANY.phone, 16, y + 35);
  doc.text(COMPANY.email, 16, y + 41);
  doc.text('VAT: ' + COMPANY.vat, 16, y + 47);
  const toLabel = isInvoice ? 'BILL TO' : 'PREPARED FOR';
  doc.setFillColor(C.lightGray[0], C.lightGray[1], C.lightGray[2]);
  doc.roundedRect(col2, y, pw / 2 - 14, 52, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(C.purple[0], C.purple[1], C.purple[2]);
  doc.text(toLabel, col2 + 6, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
  doc.text(data.client_name || '—', col2 + 6, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(C.gray[0], C.gray[1], C.gray[2]);
  if (data.client_address) doc.text(data.client_address, col2 + 6, y + 23);
  if (data.client_city) doc.text(data.client_city, col2 + 6, y + 29);
  if (data.client_phone) doc.text(data.client_phone, col2 + 6, y + 35);
  if (data.client_email) doc.text(data.client_email, col2 + 6, y + 41);
  const ref = data.project_ref || data.po_ref;
  if (ref) doc.text('Ref: ' + ref, col2 + 6, y + 47);
  return y + 58;
}

function drawMetaBox(doc, fields, y) {
  const pw = doc.internal.pageSize.width;
  const boxW = 110;
  const x = pw - boxW - 10;
  doc.setFillColor(C.dark[0], C.dark[1], C.dark[2]);
  doc.roundedRect(x, y, boxW, fields.length * 10 + 8, 3, 3, 'F');
  fields.forEach(function(field, i) {
    var ry = y + 10 + i * 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(C.cyan[0], C.cyan[1], C.cyan[2]);
    doc.text(field[0] + ':', x + 6, ry);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(C.white[0], C.white[1], C.white[2]);
    doc.text(String(field[1] || '—'), x + boxW - 4, ry, { align: 'right' });
  });
  return y + fields.length * 10 + 14;
}

function drawTotals(doc, rows, y, pw) {
  const totW = 110;
  const totX = pw - totW - 10;
  rows.forEach(function(row, i) {
    var label = row[0];
    var val = row[1];
    var isHighlight = row[2] === true;
    var ry = y + i * 9;
    if (isHighlight) {
      doc.setFillColor(C.dark[0], C.dark[1], C.dark[2]);
      doc.rect(totX, ry - 5, totW, 10, 'F');
    }
    doc.setFont('helvetica', isHighlight ? 'bold' : 'normal');
    doc.setFontSize(isHighlight ? 9.5 : 8.5);
    doc.setTextColor(isHighlight ? C.white[0] : C.gray[0], isHighlight ? C.white[1] : C.gray[1], isHighlight ? C.white[2] : C.gray[2]);
    doc.text(label, totX + 4, ry + 1);
    doc.setTextColor(isHighlight ? C.cyan[0] : C.dark[0], isHighlight ? C.cyan[1] : C.dark[1], isHighlight ? C.cyan[2] : C.dark[2]);
    doc.text(val, pw - 14, ry + 1, { align: 'right' });
  });
}

function drawFooter(doc) {
  const pw = doc.internal.pageSize.width;
  const fh = doc.internal.pageSize.height;
  doc.setFillColor(C.dark[0], C.dark[1], C.dark[2]);
  doc.rect(0, fh - 14, pw, 14, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(C.cyan[0], C.cyan[1], C.cyan[2]);
  doc.text(COMPANY.name + '  |  ' + COMPANY.tagline + '  |  ' + COMPANY.email, pw / 2, fh - 5, { align: 'center' });
}

export function generateQuotePDF(quote) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.width;
  var y = drawHeader(doc, 'QUOTATION');

  y = drawMetaBox(doc, [
    ['Quote No.', quote.quote_number],
    ['Quote Date', fmtDate(quote.quote_date)],
    ['Valid Until', fmtDate(quote.valid_until)],
    ['Status', (quote.status || 'draft').toUpperCase()],
  ], y);

  y = drawFromTo(doc, quote, y, false);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Description', 'Qty', 'Unit Price (BWP)', 'Amount (BWP)']],
    body: (quote.items || []).map(function(it, i) {
      return [i + 1, it.description || '', it.qty || 0, Number(it.unit_price || 0).toFixed(2), Number((it.qty || 0) * (it.unit_price || 0)).toFixed(2)];
    }),
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [26, 26, 46], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 248, 255] },
    columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 35, halign: 'right' }, 4: { cellWidth: 38, halign: 'right' } },
    margin: { left: 10, right: 10 },
    theme: 'grid',
  });

  y = doc.lastAutoTable.finalY + 6;
  var vatPct = ((quote.vat_rate || 0.14) * 100).toFixed(0);
  var rows = [
    ['Subtotal', fmtAmt(quote.subtotal), false],
    ['VAT (' + vatPct + '%)', fmtAmt(quote.vat_amount), false],
  ];
  if (Number(quote.discount) > 0) rows.push(['Discount', '- ' + fmtAmt(quote.discount), false]);
  rows.push(['TOTAL (BWP)', fmtAmt(quote.total), true]);
  drawTotals(doc, rows, y, pw);
  y += rows.length * 9 + 8;

  if (y < 250) {
    doc.setFillColor(C.lightGray[0], C.lightGray[1], C.lightGray[2]);
    doc.rect(10, y, pw - 20, 1, 'F');
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
    doc.text('TERMS & CONDITIONS', 10, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(C.gray[0], C.gray[1], C.gray[2]);
    ['1. This quotation is valid for 30 days from date of issue.',
     '2. Prices are in Botswana Pula (BWP) inclusive of VAT at 14%.',
     '3. A 50% deposit is required upon acceptance.',
     '4. Delivery/installation timelines confirmed upon receipt of deposit.'
    ].forEach(function(t) { doc.text(t, 10, y); y += 5; });
  }

  drawFooter(doc);
  doc.save(quote.quote_number + '.pdf');
}

export function generateInvoicePDF(invoice, payments) {
  if (!payments) payments = [];
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.width;
  var y = drawHeader(doc, 'TAX INVOICE');

  const totalPaid = payments.reduce(function(s, p) { return s + Number(p.amount); }, 0);
  const balance = Number(invoice.total) - totalPaid;
  var vatPct = ((invoice.vat_rate || 0.14) * 100).toFixed(0);

  y = drawMetaBox(doc, [
    ['Invoice No.', invoice.invoice_number],
    ['Invoice Date', fmtDate(invoice.invoice_date)],
    ['Due Date', fmtDate(invoice.due_date)],
    ['Quote Ref.', invoice.quote_number || 'Direct Invoice'],
    ['Status', (invoice.status || 'unpaid').toUpperCase()],
  ], y);

  y = drawFromTo(doc, invoice, y, true);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Description', 'Qty', 'Unit Price (BWP)', 'Amount (BWP)']],
    body: (invoice.items || []).map(function(it, i) {
      return [i + 1, it.description || '', it.qty || 0, Number(it.unit_price || 0).toFixed(2), Number((it.qty || 0) * (it.unit_price || 0)).toFixed(2)];
    }),
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [26, 26, 46], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 248, 255] },
    columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 35, halign: 'right' }, 4: { cellWidth: 38, halign: 'right' } },
    margin: { left: 10, right: 10 },
    theme: 'grid',
  });

  y = doc.lastAutoTable.finalY + 6;
  var rows = [
    ['Subtotal', fmtAmt(invoice.subtotal), false],
    ['VAT (' + vatPct + '%)', fmtAmt(invoice.vat_amount), false],
  ];
  if (Number(invoice.discount) > 0) rows.push(['Discount', '- ' + fmtAmt(invoice.discount), false]);
  rows.push(['TOTAL DUE (BWP)', fmtAmt(invoice.total), true]);
  if (payments.length > 0) {
    payments.forEach(function(p, i) {
      rows.push(['Payment ' + (i + 1) + ' (' + fmtDate(p.payment_date) + ')', '- ' + fmtAmt(p.amount), false]);
    });
    rows.push(['BALANCE DUE', fmtAmt(balance), true]);
  }
  drawTotals(doc, rows, y, pw);
  y += rows.length * 9 + 8;

  if (payments.length > 0 && y < 230) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
    doc.text('PAYMENT HISTORY', 10, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Method', 'Reference', 'Amount']],
      body: payments.map(function(p) { return [fmtDate(p.payment_date), p.payment_method || '—', p.reference || '—', fmtAmt(p.amount)]; }),
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      headStyles: { fillColor: [60, 60, 90], textColor: [255, 255, 255], fontSize: 7.5 },
      margin: { left: 10, right: 10 },
      theme: 'grid',
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  if (invoice.notes && y < 255) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
    doc.text('NOTES', 10, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(C.gray[0], C.gray[1], C.gray[2]);
    doc.text(invoice.notes, 10, y);
    y += 8;
  }

  if (y < 250) {
    doc.setFillColor(C.lightGray[0], C.lightGray[1], C.lightGray[2]);
    doc.rect(10, y, pw - 20, 1, 'F');
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
    doc.text('PAYMENT DETAILS', 10, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(C.gray[0], C.gray[1], C.gray[2]);
    doc.text('Account Name: Information Networking', 10, y);
    doc.text('Please quote invoice number on all payments. Thank you for your business!', 10, y + 5);
  }

  drawFooter(doc);
  doc.save(invoice.invoice_number + '.pdf');
}
