import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const CO = {
  name: 'Information Networking',
  address: 'Plot 143 Seorome Ward',
  city: 'Palapye',
  country: 'Botswana',
  phone: '+267 76 173 945',
  email: 'info@in-networking.com',
  vat: 'BW00000495441',
  tagline: 'Connecting Innovation, Empowering Networks',
  bank_name: '',
  bank_account: 'Information Networking',
  bank_number: '',
  bank_branch: '',
  terms_quote: '1. This quotation is valid for 30 days from the date of issue.\n2. Prices are quoted in Botswana Pula (BWP) inclusive of VAT at 14% where applicable.\n3. A 50% deposit is required upon acceptance of this quotation.\n4. Delivery / installation timelines will be confirmed upon receipt of deposit.\n5. This quotation does not constitute a binding contract until a purchase order is received.',
  terms_invoice: 'Payment is due within 30 days of invoice date. Please quote the invoice number on all payments. Thank you for your business!',
};

const D = [26,26,46], P = [124,58,237], CY = [6,182,212], W = [255,255,255], GR = [110,110,140], LG = [238,238,250];

function fd(d) { if(!d) return '—'; try { return format(new Date(d),'dd MMM yyyy'); } catch(e){ return d; } }
function fa(n) { return 'BWP '+Number(n||0).toLocaleString('en-BW',{minimumFractionDigits:2}); }

function hdr(doc, type, logoB64) {
  const pw = doc.internal.pageSize.width;
  doc.setFillColor(D[0],D[1],D[2]); doc.rect(0,0,pw,44,'F');
  doc.setFillColor(P[0],P[1],P[2]); doc.rect(0,40,pw/2,4,'F');
  doc.setFillColor(CY[0],CY[1],CY[2]); doc.rect(pw/2,40,pw/2,4,'F');
  if (logoB64) { try { doc.addImage(logoB64,'JPEG',10,6,28,28); } catch(e){} }
  doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.setTextColor(W[0],W[1],W[2]);
  doc.text(CO.name.toUpperCase(), logoB64?42:14, 17);
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(CY[0],CY[1],CY[2]);
  doc.text(CO.tagline.toUpperCase(), logoB64?42:14, 24);
  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(W[0],W[1],W[2]);
  doc.text(type, pw-12, 24, {align:'right'});
  return 52;
}

function metaBox(doc, fields, y) {
  const pw = doc.internal.pageSize.width, bw = 115, x = pw-bw-10;
  doc.setFillColor(D[0],D[1],D[2]); doc.roundedRect(x,y,bw,fields.length*10+8,3,3,'F');
  fields.forEach(function(f,i) {
    var ry = y+10+i*10;
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(CY[0],CY[1],CY[2]);
    doc.text(f[0]+':', x+5, ry);
    doc.setFont('helvetica','bold'); doc.setTextColor(W[0],W[1],W[2]);
    doc.text(String(f[1]||'—'), x+bw-4, ry, {align:'right'});
  });
  return y+fields.length*10+14;
}

function fromTo(doc, data, y, isInv) {
  const pw = doc.internal.pageSize.width, c2 = pw/2+4;
  var h = 56;
  doc.setFillColor(LG[0],LG[1],LG[2]); doc.roundedRect(10,y,pw/2-14,h,3,3,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(P[0],P[1],P[2]);
  doc.text('FROM', 16, y+8);
  doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(D[0],D[1],D[2]);
  doc.text(CO.name, 16, y+16);
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(GR[0],GR[1],GR[2]);
  doc.text(CO.address, 16, y+23);
  doc.text(CO.city+', '+CO.country, 16, y+29);
  doc.text(CO.phone, 16, y+35);
  doc.text(CO.email, 16, y+41);
  doc.text('VAT: '+CO.vat, 16, y+47);

  doc.setFillColor(LG[0],LG[1],LG[2]); doc.roundedRect(c2,y,pw/2-14,h,3,3,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(CY[0],CY[1],CY[2]);
  doc.text(isInv?'BILL TO':'PREPARED FOR', c2+5, y+8);
  doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(D[0],D[1],D[2]);
  doc.text(data.client_name||'—', c2+5, y+16);
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(GR[0],GR[1],GR[2]);
  var cy2 = y+23;
  if(data.client_address){doc.text(data.client_address,c2+5,cy2);cy2+=6;}
  if(data.client_city){doc.text(data.client_city+(data.client_country?', '+data.client_country:''),c2+5,cy2);cy2+=6;}
  if(data.client_phone){doc.text(data.client_phone,c2+5,cy2);cy2+=6;}
  if(data.client_email){doc.text(data.client_email,c2+5,cy2);cy2+=6;}
  var ref = data.project_ref||data.po_ref;
  if(ref){doc.text('Ref: '+ref,c2+5,cy2);}
  return y+h+6;
}

function totals(doc, rows, y, pw) {
  var tw=115, tx=pw-tw-10;
  rows.forEach(function(r,i) {
    var ry=y+i*9, hi=r[2];
    if(hi){doc.setFillColor(D[0],D[1],D[2]);doc.rect(tx,ry-5,tw,10,'F');}
    doc.setFont('helvetica',hi?'bold':'normal'); doc.setFontSize(hi?9:8);
    doc.setTextColor(hi?W[0]:GR[0],hi?W[1]:GR[1],hi?W[2]:GR[2]);
    doc.text(r[0],tx+4,ry+1);
    doc.setTextColor(hi?CY[0]:D[0],hi?CY[1]:D[1],hi?CY[2]:D[2]);
    doc.text(r[1],pw-12,ry+1,{align:'right'});
  });
}

function footer(doc) {
  var pw=doc.internal.pageSize.width, ph=doc.internal.pageSize.height;
  doc.setFillColor(D[0],D[1],D[2]); doc.rect(0,ph-13,pw,13,'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(CY[0],CY[1],CY[2]);
  doc.text(CO.name+' | '+CO.tagline+' | '+CO.email, pw/2, ph-4.5, {align:'center'});
}

export function generateQuotePDF(quote, logoB64) {
  var doc = new jsPDF({unit:'mm',format:'a4'}), pw = doc.internal.pageSize.width;
  var y = hdr(doc,'QUOTATION',logoB64);
  y = metaBox(doc,[
    ['Quote No.',quote.quote_number],
    ['Quote Date',fd(quote.quote_date)],
    ['Valid Until',fd(quote.valid_until)],
    ['Status',(quote.status||'draft').toUpperCase()],
  ],y);
  y = fromTo(doc,quote,y,false);
  autoTable(doc,{startY:y,
    head:[['#','Description','Qty','Unit Price (BWP)','Amount (BWP)']],
    body:(quote.items||[]).map(function(it,i){return[i+1,it.description||'',it.qty||0,Number(it.unit_price||0).toFixed(2),Number((it.qty||0)*(it.unit_price||0)).toFixed(2)];}),
    styles:{fontSize:8.5,cellPadding:3},
    headStyles:{fillColor:D,textColor:W,fontStyle:'bold',fontSize:8},
    alternateRowStyles:{fillColor:[246,246,254]},
    columnStyles:{0:{cellWidth:10,halign:'center'},2:{cellWidth:14,halign:'center'},3:{cellWidth:36,halign:'right'},4:{cellWidth:38,halign:'right'}},
    margin:{left:10,right:10},theme:'grid',
  });
  y = doc.lastAutoTable.finalY+6;
  var vp = ((quote.vat_rate||0.14)*100).toFixed(0);
  var rows=[['Subtotal',fa(quote.subtotal),false],['VAT ('+vp+'%)',fa(quote.vat_amount),false]];
  if(Number(quote.discount)>0) rows.push(['Discount','- '+fa(quote.discount),false]);
  rows.push(['TOTAL (BWP)',fa(quote.total),true]);
  totals(doc,rows,y,pw); y+=rows.length*9+10;
  if(y<248){
    doc.setFillColor(LG[0],LG[1],LG[2]); doc.rect(10,y,pw-20,1,'F'); y+=5;
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(D[0],D[1],D[2]);
    doc.text('SCOPE, TERMS & CONDITIONS',10,y); y+=5;
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(GR[0],GR[1],GR[2]);
    var terms=CO.terms_quote.split('\n');
    terms.forEach(function(t){doc.text(t,10,y);y+=5;});
  }
  if(y<258){
    y+=4;
    doc.setFillColor(LG[0],LG[1],LG[2]); doc.rect(10,y,pw-20,1,'F'); y+=5;
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(D[0],D[1],D[2]);
    doc.text('ACCEPTANCE',10,y); y+=6;
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(GR[0],GR[1],GR[2]);
    doc.text('Authorised Signatory: _______________________',10,y);
    doc.text('Designation: _______________________',pw/2,y);
    y+=7;
    doc.text('Signature: _______________________',10,y);
    doc.text('Date: _______________________',pw/2,y);
  }
  footer(doc); doc.save(quote.quote_number+'.pdf');
}

export function generateInvoicePDF(invoice, payments, logoB64) {
  if(!payments) payments=[];
  var doc=new jsPDF({unit:'mm',format:'a4'}), pw=doc.internal.pageSize.width;
  var y=hdr(doc,'TAX INVOICE',logoB64);
  var paid=payments.reduce(function(s,p){return s+Number(p.amount);},0);
  var bal=Number(invoice.total)-paid;
  var vp=((invoice.vat_rate||0.14)*100).toFixed(0);
  y=metaBox(doc,[
    ['Invoice No.',invoice.invoice_number],
    ['Invoice Date',fd(invoice.invoice_date)],
    ['Due Date',fd(invoice.due_date)],
    ['Quote Ref.',invoice.quote_number||'Direct Invoice'],
    ['Status',(invoice.status||'unpaid').toUpperCase()],
  ],y);
  y=fromTo(doc,invoice,y,true);
  autoTable(doc,{startY:y,
    head:[['#','Description','Qty','Unit Price (BWP)','Amount (BWP)']],
    body:(invoice.items||[]).map(function(it,i){return[i+1,it.description||'',it.qty||0,Number(it.unit_price||0).toFixed(2),Number((it.qty||0)*(it.unit_price||0)).toFixed(2)];}),
    styles:{fontSize:8.5,cellPadding:3},
    headStyles:{fillColor:D,textColor:W,fontStyle:'bold',fontSize:8},
    alternateRowStyles:{fillColor:[246,246,254]},
    columnStyles:{0:{cellWidth:10,halign:'center'},2:{cellWidth:14,halign:'center'},3:{cellWidth:36,halign:'right'},4:{cellWidth:38,halign:'right'}},
    margin:{left:10,right:10},theme:'grid',
  });
  y=doc.lastAutoTable.finalY+6;
  var rows=[['Subtotal',fa(invoice.subtotal),false],['VAT ('+vp+'%)',fa(invoice.vat_amount),false]];
  if(Number(invoice.discount)>0) rows.push(['Discount','- '+fa(invoice.discount),false]);
  rows.push(['TOTAL DUE (BWP)',fa(invoice.total),true]);
  if(payments.length>0){
    payments.forEach(function(p,i){rows.push(['Payment '+(i+1)+' ('+fd(p.payment_date)+')','- '+fa(p.amount),false]);});
    rows.push(['BALANCE DUE',bal<=0?'FULLY PAID':fa(bal),true]);
  }
  totals(doc,rows,y,pw); y+=rows.length*9+10;
  if(payments.length>0&&y<225){
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(D[0],D[1],D[2]);
    doc.text('PAYMENT HISTORY',10,y); y+=3;
    autoTable(doc,{startY:y,
      head:[['Date','Method','Reference','Amount']],
      body:payments.map(function(p){return[fd(p.payment_date),p.payment_method||'—',p.reference||'—',fa(p.amount)];}),
      styles:{fontSize:7.5,cellPadding:2.5},headStyles:{fillColor:[50,50,80],textColor:W,fontSize:7.5},
      margin:{left:10,right:10},theme:'grid',
    });
    y=doc.lastAutoTable.finalY+6;
  }
  if(y<248){
    doc.setFillColor(LG[0],LG[1],LG[2]); doc.rect(10,y,pw-20,1,'F'); y+=5;
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(D[0],D[1],D[2]);
    doc.text('PAYMENT DETAILS',10,y); y+=6;
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(GR[0],GR[1],GR[2]);
    if(CO.bank_name) doc.text('Bank: '+CO.bank_name,10,y++*0+y);
    doc.text('Account Name: '+CO.bank_account,10,y); y+=5;
    if(CO.bank_number) {doc.text('Account Number: '+CO.bank_number,10,y); y+=5;}
  }
  if(y<258){
    doc.setFillColor(LG[0],LG[1],LG[2]); doc.rect(10,y,pw-20,1,'F'); y+=5;
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(D[0],D[1],D[2]);
    doc.text('NOTES & TERMS',10,y); y+=5;
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(GR[0],GR[1],GR[2]);
    doc.text(CO.terms_invoice,10,y,{maxWidth:pw-20});
    if(invoice.notes){y+=7;doc.text(invoice.notes,10,y,{maxWidth:pw-20});}
  }
  footer(doc); doc.save(invoice.invoice_number+'.pdf');
}
