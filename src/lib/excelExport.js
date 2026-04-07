import * as XLSX from 'xlsx';
import { format } from 'date-fns';

function fmtDate(d) {
  if (!d) return '';
  try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return d; }
}

export function exportQuoteToExcel(quote) {
  const wb = XLSX.utils.book_new();
  const wsData = [];

  wsData.push(['QUOTATION']);
  wsData.push([]);
  wsData.push(['', '', '', '', '', '', 'Quote No.', '', quote.quote_number]);
  wsData.push(['', '', '', '', '', '', 'Quote Date', '', fmtDate(quote.quote_date)]);
  wsData.push(['', '', '', '', '', '', 'Valid Until', '', fmtDate(quote.valid_until)]);
  wsData.push([]);
  wsData.push(['FROM', '', '', '', '', '', 'PREPARED FOR']);
  wsData.push(['Company Name', '', 'Information Networking', '', '', '', 'Client Name', '', quote.client_name]);
  wsData.push(['Address', '', 'Plot 143 Seorome Ward', '', '', '', 'Address', '', quote.client_address || '']);
  wsData.push(['City/Town', '', 'Palapye', '', '', '', 'City/Town', '', quote.client_city || '']);
  wsData.push(['Country', '', 'Botswana', '', '', '', 'Country', '', quote.client_country || 'Botswana']);
  wsData.push(['Phone', '', '+267 76 173 945', '', '', '', 'Phone', '', quote.client_phone || '']);
  wsData.push(['Email', '', 'info@in-networking.com', '', '', '', 'Email', '', quote.client_email || '']);
  wsData.push(['VAT Reg. No.', '', '', 'BW00000495441', '', '', 'Project/Ref.', '', quote.project_ref || '']);
  wsData.push([]);
  wsData.push(['#', 'Description', '', '', '', 'Qty', 'Unit Price (BWP)', '', 'Amount (BWP)']);

  (quote.items || []).forEach((it, i) => {
    wsData.push([i + 1, it.description || '', '', '', '', it.qty || 0, it.unit_price || 0, '', (it.qty || 0) * (it.unit_price || 0)]);
  });

  wsData.push([]);
  wsData.push(['', '', '', '', '', '', '', 'Subtotal', Number(quote.subtotal || 0).toFixed(2)]);
  wsData.push(['', '', '', '', '', '', '', `VAT (${((quote.vat_rate || 0.14) * 100).toFixed(0)}%)`, Number(quote.vat_amount || 0).toFixed(2)]);
  if (Number(quote.discount) > 0) wsData.push(['', '', '', '', '', '', '', 'Discount', Number(quote.discount || 0).toFixed(2)]);
  wsData.push(['', '', '', '', '', '', '', 'TOTAL (BWP)', Number(quote.total || 0).toFixed(2)]);
  wsData.push([]);
  wsData.push(['SCOPE, TERMS & CONDITIONS']);
  wsData.push(['1. This quotation is valid for 30 days from date of issue.']);
  wsData.push(['2. Prices in BWP inclusive of VAT at 14%.']);
  wsData.push(['3. 50% deposit required upon acceptance.']);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 14 }, { wch: 32 }, { wch: 24 }, { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 18 }, { wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Quotation');
  XLSX.writeFile(wb, `${quote.quote_number}.xlsx`);
}

export function exportInvoiceToExcel(invoice, payments = []) {
  const wb = XLSX.utils.book_new();
  const wsData = [];
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = Number(invoice.total) - totalPaid;

  wsData.push(['TAX INVOICE']);
  wsData.push([]);
  wsData.push(['', '', '', '', '', '', 'Invoice No.', '', invoice.invoice_number]);
  wsData.push(['', '', '', '', '', '', 'Invoice Date', '', fmtDate(invoice.invoice_date)]);
  wsData.push(['', '', '', '', '', '', 'Due Date', '', fmtDate(invoice.due_date)]);
  wsData.push(['', '', '', '', '', '', 'Quote Ref.', '', invoice.quote_number || 'Direct Invoice']);
  wsData.push([]);
  wsData.push(['FROM', '', '', '', '', '', 'BILL TO']);
  wsData.push(['Company Name', '', 'Information Networking', '', '', '', 'Name', '', invoice.client_name]);
  wsData.push(['Address', '', 'Plot 143 Seorome Ward', '', '', '', 'Address', '', invoice.client_address || '']);
  wsData.push(['City/Town', '', 'Palapye', '', '', '', 'City/Town', '', invoice.client_city || '']);
  wsData.push(['Country', '', 'Botswana', '', '', '', 'Country', '', invoice.client_country || 'Botswana']);
  wsData.push(['Phone', '', '+267 76 173 945', '', '', '', 'Phone', '', invoice.client_phone || '']);
  wsData.push(['Email', '', 'info@in-networking.com', '', '', '', 'Email', '', invoice.client_email || '']);
  wsData.push(['VAT Reg. No.', '', '', 'BW00000495441', '', '', 'PO/Ref. No.', '', invoice.po_ref || '']);
  wsData.push([]);
  wsData.push(['#', 'Description', '', '', '', 'Qty', 'Unit Price (BWP)', '', 'Amount (BWP)']);

  (invoice.items || []).forEach((it, i) => {
    wsData.push([i + 1, it.description || '', '', '', '', it.qty || 0, it.unit_price || 0, '', (it.qty || 0) * (it.unit_price || 0)]);
  });

  wsData.push([]);
  wsData.push(['', '', '', '', '', '', '', 'Subtotal', Number(invoice.subtotal || 0).toFixed(2)]);
  wsData.push(['', '', '', '', '', '', '', `VAT (${((invoice.vat_rate || 0.14) * 100).toFixed(0)}%)`, Number(invoice.vat_amount || 0).toFixed(2)]);
  if (Number(invoice.discount) > 0) wsData.push(['', '', '', '', '', '', '', 'Discount', Number(invoice.discount || 0).toFixed(2)]);
  wsData.push(['', '', '', '', '', '', '', 'TOTAL DUE (BWP)', Number(invoice.total || 0).toFixed(2)]);

  if (payments.length > 0) {
    wsData.push([]);
    wsData.push(['PAYMENT HISTORY']);
    wsData.push(['Date', 'Method', 'Reference', 'Amount']);
    payments.forEach(p => wsData.push([fmtDate(p.payment_date), p.payment_method || '', p.reference || '', Number(p.amount).toFixed(2)]));
    wsData.push(['', '', 'Total Paid', totalPaid.toFixed(2)]);
    wsData.push(['', '', 'BALANCE DUE', balance.toFixed(2)]);
  }

  wsData.push([]);
  wsData.push(['PAYMENT DETAILS']);
  wsData.push(['Account Name: Information Networking']);
  wsData.push(['Payment is due within 30 days of invoice date.']);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 14 }, { wch: 32 }, { wch: 24 }, { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 18 }, { wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
  XLSX.writeFile(wb, `${invoice.invoice_number}.xlsx`);
}
