import * as XLSX from 'xlsx';
import { format } from 'date-fns';
function fd(d){if(!d)return'';try{return format(new Date(d),'dd/MM/yyyy');}catch(e){return d;}}
const CO={name:'Information Networking',address:'Plot 143 Seorome Ward',city:'Palapye',country:'Botswana',phone:'+267 76 173 945',email:'info@in-networking.com',vat:'BW00000495441'};

export function exportQuoteXLSX(q){
  var wb=XLSX.utils.book_new();
  var d=[['QUOTATION'],[]
    ,['','','','','','','Quote No.','',q.quote_number]
    ,['','','','','','','Quote Date','',fd(q.quote_date)]
    ,['','','','','','','Valid Until','',fd(q.valid_until)]
    ,['','','','','','','Status','',q.status||'draft'],[]
    ,['FROM','','','','','','PREPARED FOR']
    ,['Company Name','',CO.name,'','','','Client Name','',q.client_name]
    ,['Address','',CO.address,'','','','Address','',q.client_address||'']
    ,['City / Town','',CO.city,'','','','City / Town','',q.client_city||'']
    ,['Country','',CO.country,'','','','Country','',q.client_country||'Botswana']
    ,['Phone','',CO.phone,'','','','Phone','',q.client_phone||'']
    ,['Email','',CO.email,'','','','Email','',q.client_email||'']
    ,['VAT Reg. No.','','',CO.vat,'','','Project / Ref.','',q.project_ref||''],[]
    ,['#','Description','','','','Qty','Unit Price (BWP)','','Amount (BWP)']
  ];
  (q.items||[]).forEach(function(it,i){d.push([i+1,it.description||'','','','',it.qty||0,Number(it.unit_price||0).toFixed(2),'',Number((it.qty||0)*(it.unit_price||0)).toFixed(2)]);});
  d.push([]);
  d.push(['','','','','','','','Subtotal',Number(q.subtotal||0).toFixed(2)]);
  d.push(['','','','','','','','VAT ('+((q.vat_rate||0.14)*100).toFixed(0)+'%)',Number(q.vat_amount||0).toFixed(2)]);
  if(Number(q.discount)>0) d.push(['','','','','','','','Discount',Number(q.discount||0).toFixed(2)]);
  d.push(['','','','','','','','TOTAL (BWP)',Number(q.total||0).toFixed(2)]);
  d.push([]);
  d.push(['SCOPE, TERMS & CONDITIONS']);
  d.push(['1. This quotation is valid for 30 days from the date of issue.']);
  d.push(['2. Prices in BWP inclusive of VAT at 14%.']);
  d.push(['3. 50% deposit required upon acceptance.']);
  d.push(['4. Delivery/installation timelines confirmed upon receipt of deposit.']);
  d.push(['5. This quotation does not constitute a binding contract until a purchase order is received.']);
  d.push([]);d.push(['Information Networking | Connecting Innovation, Empowering Networks | info@in-networking.com']);
  var ws=XLSX.utils.aoa_to_sheet(d);
  ws['!cols']=[{wch:14},{wch:30},{wch:22},{wch:16},{wch:10},{wch:8},{wch:18},{wch:14},{wch:18}];
  XLSX.utils.book_append_sheet(wb,ws,'Quotation');
  XLSX.writeFile(wb,q.quote_number+'.xlsx');
}

export function exportInvoiceXLSX(inv,payments){
  if(!payments)payments=[];
  var wb=XLSX.utils.book_new();
  var paid=payments.reduce(function(s,p){return s+Number(p.amount);},0);
  var bal=Number(inv.total)-paid;
  var d=[['TAX INVOICE'],[]
    ,['','','','','','','Invoice No.','',inv.invoice_number]
    ,['','','','','','','Invoice Date','',fd(inv.invoice_date)]
    ,['','','','','','','Due Date','',fd(inv.due_date)]
    ,['','','','','','','Quote Ref.','',inv.quote_number||'Direct Invoice']
    ,['','','','','','','Status','',inv.status||'unpaid'],[]
    ,['FROM','','','','','','BILL TO']
    ,['Company Name','',CO.name,'','','','Name','',inv.client_name]
    ,['Address','',CO.address,'','','','Address','',inv.client_address||'']
    ,['City / Town','',CO.city,'','','','City / Town','',inv.client_city||'']
    ,['Country','',CO.country,'','','','Country','',inv.client_country||'Botswana']
    ,['Phone','',CO.phone,'','','','Phone','',inv.client_phone||'']
    ,['Email','',CO.email,'','','','Email','',inv.client_email||'']
    ,['VAT Reg. No.','','',CO.vat,'','','PO / Ref. No.','',inv.po_ref||''],[]
    ,['#','Description','','','','Qty','Unit Price (BWP)','','Amount (BWP)']
  ];
  (inv.items||[]).forEach(function(it,i){d.push([i+1,it.description||'','','','',it.qty||0,Number(it.unit_price||0).toFixed(2),'',Number((it.qty||0)*(it.unit_price||0)).toFixed(2)]);});
  d.push([]);
  d.push(['','','','','','','','Subtotal',Number(inv.subtotal||0).toFixed(2)]);
  d.push(['','','','','','','','VAT ('+((inv.vat_rate||0.14)*100).toFixed(0)+'%)',Number(inv.vat_amount||0).toFixed(2)]);
  if(Number(inv.discount)>0) d.push(['','','','','','','','Discount',Number(inv.discount||0).toFixed(2)]);
  d.push(['','','','','','','','TOTAL DUE (BWP)',Number(inv.total||0).toFixed(2)]);
  if(payments.length>0){
    d.push([]);d.push(['PAYMENT HISTORY']);d.push(['Date','Method','Reference','Amount']);
    payments.forEach(function(p){d.push([fd(p.payment_date),p.payment_method||'',p.reference||'',Number(p.amount).toFixed(2)]);});
    d.push(['','','Total Paid',paid.toFixed(2)]);
    d.push(['','','BALANCE DUE',Math.max(bal,0).toFixed(2)]);
  }
  d.push([]);d.push(['PAYMENT DETAILS']);
  d.push(['Account Name: Information Networking']);
  d.push(['Payment is due within 30 days. Please quote the invoice number on all payments.']);
  d.push([]);d.push(['Information Networking | Connecting Innovation, Empowering Networks | info@in-networking.com']);
  var ws=XLSX.utils.aoa_to_sheet(d);
  ws['!cols']=[{wch:14},{wch:30},{wch:22},{wch:16},{wch:10},{wch:8},{wch:18},{wch:14},{wch:18}];
  XLSX.utils.book_append_sheet(wb,ws,'Invoice');
  XLSX.writeFile(wb,inv.invoice_number+'.xlsx');
}
