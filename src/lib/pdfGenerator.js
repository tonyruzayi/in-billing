import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Company details from templates
const CO = {
  name: 'Information Networking',
  address: 'Plot 143 Seorome Ward',
  city: 'Palapye',
  country: 'Botswana',
  phone: '+267 76 173 945',
  email: 'info@in-networking.com',
  vat: 'BW00000495441',
  tagline: 'Connecting Innovation, Empowering Networks',
  footer: 'Information Networking  |  Connecting Innovation, Empowering Networks  |  info@in-networking.com',
  // From invoice template
  bank_name: '',
  bank_account: 'Information Networking',
  bank_number: '',
  bank_branch: '',
  bank_swift: '',
  // Terms from templates
  quote_terms: '1. This quotation is valid for 30 days from the date of issue.\n2. Prices are quoted in Botswana Pula (BWP) and are inclusive of VAT at 14% where applicable.\n3. A 50% deposit is required upon acceptance of this quotation.\n4. Delivery / installation timelines will be confirmed upon receipt of deposit.\n5. This quotation does not constitute a binding contract until a purchase order is received.',
  invoice_terms: 'Payment is due within 30 days of invoice date. Please quote the invoice number on all payments. Thank you for your business!',
};

// Colors
var D=[26,26,46], P=[124,58,237], CY=[6,182,212], W=[255,255,255], GR=[100,100,130], LG=[238,238,250];

function fd(d) { if(!d) return '—'; try { return format(new Date(d),'dd MMM yyyy'); } catch(e) { return String(d); } }
function fa(n) { return 'BWP '+Number(n||0).toLocaleString('en-BW',{minimumFractionDigits:2,maximumFractionDigits:2}); }

function drawHeader(doc, type, logoB64) {
  var pw = doc.internal.pageSize.width;
  doc.setFillColor(D[0],D[1],D[2]); doc.rect(0,0,pw,44,'F');
  doc.setFillColor(P[0],P[1],P[2]); doc.rect(0,40,pw/2,4,'F');
  doc.setFillColor(CY[0],CY[1],CY[2]); doc.rect(pw/2,40,pw/2,4,'F');
  var textX = 14;
  if (logoB64) {
    try { doc.addImage(logoB64,'JPEG',10,7,26,26); textX = 42; } catch(e) {}
  }
  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(W[0],W[1],W[2]);
  doc.text(CO.name.toUpperCase(), textX, 18);
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(CY[0],CY[1],CY[2]);
  doc.text(CO.tagline.toUpperCase(), textX, 25);
  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(W[0],W[1],W[2]);
  doc.text(type, pw-12, 25, {align:'right'});
  return 52;
}

function drawMetaBox(doc, fields, y) {
  var pw = doc.internal.pageSize.width, bw = 112, x = pw-bw-10;
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

function drawFromTo(doc, data, y, isInv) {
  var pw = doc.internal.pageSize.width, c2 = pw/2+4, h = 56;
  // FROM
  doc.setFillColor(LG[0],LG[1],LG[2]); doc.roundedRect(10,y,pw/2-14,h,3,3,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(P[0],P[1],P[2]);
  doc.text('FROM', 16, y+8);
  doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(D[0],D[1],D[2]);
  doc.text('Information Networking', 16, y+17);
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(GR[0],GR[1],GR[2]);
  doc.text('Plot 143 Seorome Ward', 16, y+24);
  doc.text('Palapye, Botswana', 16, y+30);
  doc.text('+267 76 173 945', 16, y+36);
  doc.text('info@in-networking.com', 16, y+42);
  doc.text('VAT Reg. No.: BW00000495441', 16, y+48);
  // TO
  doc.setFillColor(LG[0],LG[1],LG[2]); doc.roundedRect(c2,y,pw/2-14,h,3,3,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(CY[0],CY[1],CY[2]);
  doc.text(isInv?'BILL TO':'PREPARED FOR', c2+5, y+8);
  doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(D[0],D[1],D[2]);
  doc.text(data.client_name||'—', c2+5, y+17);
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(GR[0],GR[1],GR[2]);
  var cy2 = y+24;
  if(data.client_address){doc.text(data.client_address,c2+5,cy2);cy2+=6;}
  if(data.client_city){doc.text(data.client_city+(data.client_country?', '+data.client_country:''),c2+5,cy2);cy2+=6;}
  if(data.client_phone){doc.text(data.client_phone,c2+5,cy2);cy2+=6;}
  if(data.client_email){doc.text(data.client_email,c2+5,cy2);cy2+=6;}
  var ref = data.project_ref||data.po_ref;
  if(ref){doc.text((isInv?'PO / Ref. No.':'Project / Ref.')+': '+ref,c2+5,cy2);}
  return y+h+6;
}

function drawTotals(doc, rows, y, pw) {
  var tw=112, tx=pw-tw-10;
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

function drawFooter(doc) {
  var pw=doc.internal.pageSize.width, ph=doc.internal.pageSize.height;
  doc.setFillColor(D[0],D[1],D[2]); doc.rect(0,ph-13,pw,13,'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(CY[0],CY[1],CY[2]);
  doc.text(CO.footer, pw/2, ph-4.5, {align:'center'});
}

export function generateQuotePDF(quote, logoB64) {
  var doc = new jsPDF({unit:'mm',format:'a4'}), pw = doc.internal.pageSize.width;
  var y = drawHeader(doc,'QUOTATION',logoB64);

  y = drawMetaBox(doc,[
    ['Quote No.',quote.quote_number],
    ['Quote Date',fd(quote.quote_date)],
    ['Valid Until',fd(quote.valid_until)],
    ['Status',(quote.status||'draft').toUpperCase()],
  ],y);

  y = drawFromTo(doc,quote,y,false);

  // Items table
  autoTable(doc,{
    startY:y,
    head:[['#','Description','Qty','Unit Price (BWP)','Amount (BWP)']],
    body:(quote.items||[]).map(function(it,i){
      return[i+1, it.description||'', Number(it.qty||0), Number(it.unit_price||0).toFixed(2), (Number(it.qty||0)*Number(it.unit_price||0)).toFixed(2)];
    }),
    styles:{fontSize:8.5,cellPadding:3},
    headStyles:{fillColor:D,textColor:W,fontStyle:'bold',fontSize:8},
    alternateRowStyles:{fillColor:[246,246,254]},
    columnStyles:{0:{cellWidth:10,halign:'center'},2:{cellWidth:14,halign:'center'},3:{cellWidth:36,halign:'right'},4:{cellWidth:38,halign:'right'}},
    margin:{left:10,right:10},theme:'grid',
  });

  y = doc.lastAutoTable.finalY+6;
  var vp=((Number(quote.vat_rate)||0.14)*100).toFixed(0);
  var rows=[
    ['Subtotal',fa(quote.subtotal),false],
    ['VAT ('+vp+'%)',fa(quote.vat_amount),false],
  ];
  if(Number(quote.discount)>0) rows.push(['Discount','- '+fa(quote.discount),false]);
  rows.push(['TOTAL (BWP)',fa(quote.total),true]);
  drawTotals(doc,rows,y,pw);
  y += rows.length*9+12;

  // SCOPE, TERMS & CONDITIONS (from template)
  if(y<246){
    doc.setFillColor(LG[0],LG[1],LG[2]); doc.rect(10,y,pw-20,1,'F'); y+=5;
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(D[0],D[1],D[2]);
    doc.text('SCOPE, TERMS & CONDITIONS',10,y); y+=6;
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(GR[0],GR[1],GR[2]);
    CO.quote_terms.split('\n').forEach(function(t){doc.text(t,10,y,{maxWidth:pw-20});y+=5;});
  }

  // ACCEPTANCE section
  if(y<258){
    y+=4;
    doc.setFillColor(LG[0],LG[1],LG[2]); doc.rect(10,y,pw-20,1,'F'); y+=5;
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(D[0],D[1],D[2]);
    doc.text('ACCEPTANCE',10,y); y+=7;
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(GR[0],GR[1],GR[2]);
    doc.text('Authorised Signatory: _______________________________',10,y);
    doc.text('Designation: _______________________',pw/2+4,y);
    y+=8;
    doc.text('Signature: _______________________________',10,y);
    doc.text('Date: _______________________',pw/2+4,y);
    y+=8;
    doc.text('Company Stamp:',10,y);
    doc.text('PO Number: _______________________',pw/2+4,y);
  }

  // Additional notes if any
  if(quote.notes && y<268){
    y+=6;
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(D[0],D[1],D[2]);
    doc.text('ADDITIONAL NOTES',10,y); y+=5;
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(GR[0],GR[1],GR[2]);
    doc.text(quote.notes,10,y,{maxWidth:pw-20});
  }

  drawFooter(doc);
  doc.save(quote.quote_number+'.pdf');
}

export function generateInvoicePDF(invoice, payments, logoB64) {
  if(!payments) payments=[];
  var doc = new jsPDF({unit:'mm',format:'a4'}), pw = doc.internal.pageSize.width;
  var y = drawHeader(doc,'TAX INVOICE',logoB64);

  var totalPaid = payments.reduce(function(s,p){return s+Number(p.amount);},0);
  var balance = Number(invoice.total)-totalPaid;
  var vp = ((Number(invoice.vat_rate)||0.14)*100).toFixed(0);

  y = drawMetaBox(doc,[
    ['Invoice No.',invoice.invoice_number],
    ['Invoice Date',fd(invoice.invoice_date)],
    ['Due Date',fd(invoice.due_date)],
    ['Quote Ref.',invoice.quote_number||'Direct Invoice'],
    ['Status',(invoice.status||'unpaid').toUpperCase()],
  ],y);

  y = drawFromTo(doc,invoice,y,true);

  autoTable(doc,{
    startY:y,
    head:[['#','Description','Qty','Unit Price (BWP)','Amount (BWP)']],
    body:(invoice.items||[]).map(function(it,i){
      return[i+1, it.description||'', Number(it.qty||0), Number(it.unit_price||0).toFixed(2), (Number(it.qty||0)*Number(it.unit_price||0)).toFixed(2)];
    }),
    styles:{fontSize:8.5,cellPadding:3},
    headStyles:{fillColor:D,textColor:W,fontStyle:'bold',fontSize:8},
    alternateRowStyles:{fillColor:[246,246,254]},
    columnStyles:{0:{cellWidth:10,halign:'center'},2:{cellWidth:14,halign:'center'},3:{cellWidth:36,halign:'right'},4:{cellWidth:38,halign:'right'}},
    margin:{left:10,right:10},theme:'grid',
  });

  y = doc.lastAutoTable.finalY+6;
  var rows=[
    ['Subtotal',fa(invoice.subtotal),false],
    ['VAT ('+vp+'%)',fa(invoice.vat_amount),false],
  ];
  if(Number(invoice.discount)>0) rows.push(['Discount','- '+fa(invoice.discount),false]);
  rows.push(['TOTAL DUE (BWP)',fa(invoice.total),true]);
  if(payments.length>0){
    payments.forEach(function(p,i){rows.push(['Payment '+(i+1)+' ('+fd(p.payment_date)+')','- '+fa(p.amount),false]);});
    rows.push(['BALANCE DUE', balance<=0?'FULLY PAID':fa(balance), true]);
  }
  drawTotals(doc,rows,y,pw);
  y += rows.length*9+12;

  // Payment history table
  if(payments.length>0 && y<228){
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(D[0],D[1],D[2]);
    doc.text('PAYMENT HISTORY',10,y); y+=3;
    autoTable(doc,{
      startY:y,
      head:[['Date','Method','Reference','Amount']],
      body:payments.map(function(p){return[fd(p.payment_date),p.payment_method||'—',p.reference||'—',fa(p.amount)];}),
      styles:{fontSize:7.5,cellPadding:2.5},
      headStyles:{fillColor:[50,50,80],textColor:W,fontSize:7.5},
      margin:{left:10,right:10},theme:'grid',
    });
    y = doc.lastAutoTable.finalY+6;
  }

  // PAYMENT DETAILS (from invoice template)
  if(y<248){
    doc.setFillColor(LG[0],LG[1],LG[2]); doc.rect(10,y,pw-20,1,'F'); y+=5;
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(D[0],D[1],D[2]);
    doc.text('PAYMENT DETAILS',10,y); y+=6;
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(GR[0],GR[1],GR[2]);
    if(CO.bank_name){doc.text('Bank Name: '+CO.bank_name,10,y);y+=5;}
    doc.text('Account Name: '+CO.bank_account,10,y);y+=5;
    if(CO.bank_number){doc.text('Account Number: '+CO.bank_number,10,y);y+=5;}
    if(CO.bank_branch){doc.text('Branch Code: '+CO.bank_branch,10,y);y+=5;}
    if(CO.bank_swift){doc.text('Swift/BIC: '+CO.bank_swift,10,y);y+=5;}
  }

  // NOTES & TERMS (from invoice template)
  if(y<258){
    doc.setFillColor(LG[0],LG[1],LG[2]); doc.rect(10,y,pw-20,1,'F'); y+=5;
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(D[0],D[1],D[2]);
    doc.text('NOTES & TERMS',10,y); y+=6;
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(GR[0],GR[1],GR[2]);
    doc.text(CO.invoice_terms,10,y,{maxWidth:pw-20}); y+=6;
    if(invoice.notes){
      doc.text(invoice.notes,10,y,{maxWidth:pw-20});
    }
  }

  drawFooter(doc);
  doc.save(invoice.invoice_number+'.pdf');
}
