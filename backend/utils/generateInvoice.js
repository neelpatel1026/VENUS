const PDFDocument = require("pdfkit");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const generateInvoice = async (order, res) => {
  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
    bufferPages: true // Allows for total page count and page numbering later
  });

  // Response Headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${order._id}.pdf`
  );

  doc.pipe(res);

  // Styling Tokens (Luxury Palette)
  const GOLD = "#C8A96B";
  const DARK_GRAY = "#1F2937";
  const LIGHT_GRAY = "#4B5563";
  const ACCENT_BORDER = "#ECE6DC";
  const SOFT_BG = "#FDFBF7";
  const SUCCESS_GREEN = "#166534";
  const DANGER_RED = "#991B1B";

  // Clean UTF-8 strings to WinAnsi range to prevent PDFKit rendering crashes
  const cleanText = (text) => {
    if (!text) return "";
    try {
      // Decode double-encoded strings
      text = decodeURIComponent(escape(text));
    } catch (e) {}

    return text
      .replace(/[\u2013\u2014]/g, "-") // en-dash / em-dash
      .replace(/[\u2018\u2019]/g, "'") // curly single quotes
      .replace(/[\u201C\u201D]/g, '"') // curly double quotes
      .replace(/\u00A0/g, " ")        // non-breaking space
      .replace(/[^\x20-\x7E]/g, "")   // Keep clean printable ASCII only
      .trim();
  };

  const formatPrice = (amount) => `Rs. ${parseFloat(amount || 0).toFixed(2)}`;

  /* ==========================================================================
     1. TWO-COLUMN HEADER DESIGN
     ========================================================================== */
  
  // Left Column - Brand Info
  let leftY = 40;

  // Render logo if available, else render custom placeholder
  const logoPath = path.join(__dirname, "../assets/logo.jpg");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 40, leftY, { width: 45, height: 45 });
  } else {
    doc.rect(40, leftY, 45, 45).fill(GOLD);
    doc.fillColor("white").fontSize(15).font("Helvetica-Bold").text("VC", 40, leftY + 15, { width: 45, align: "center" });
  }
  leftY += 52;

  doc.fillColor(GOLD).fontSize(16).font("Helvetica-Bold").text("VENUS CARE", 40, leftY);
  leftY += 18;
  doc.fillColor(LIGHT_GRAY).fontSize(8).font("Helvetica-Oblique").text("Luxury Skincare & Cosmetics", 40, leftY);
  leftY += 14;

  doc.fillColor(DARK_GRAY).fontSize(8).font("Helvetica");
  const brandDetails = [
    "Registered Office: Ground Floor, Gold Plaza, Bandra West, Mumbai, MH - 400050",
    "Support Email: care@venuscare.com",
    "Helpline: +91 1800-555-VENUS",
    "GSTIN: 27AAEFC9401F1Z2 (Venus Retail Private Limited)",
    "PAN: AAEFC9401F",
    "Website: www.venuscare.com"
  ];
  for (const line of brandDetails) {
    doc.text(line, 40, leftY, { width: 230 });
    leftY += doc.heightOfString(line, { width: 230 }) + 3;
  }

  // Right Column - Tax Invoice Metadata
  let rightY = 40;
  doc.fillColor(DARK_GRAY).fontSize(16).font("Helvetica-Bold").text("TAX INVOICE", 300, rightY, { align: "right" });
  rightY += 24;

  const invoiceNumber = `INV-${new Date(order.createdAt).getFullYear()}-${order._id.toString().slice(-6).toUpperCase()}`;
  const rightRows = [
    ["Invoice Number:", invoiceNumber],
    ["Invoice Date:", new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
    ["Order ID:", `#${order._id.toString().toUpperCase()}`],
    ["Payment Status:", order.paymentStatus.toUpperCase()],
    ["Payment Method:", order.paymentMethod.toUpperCase()],
    ["Transaction ID:", order.paymentId || "N/A"]
  ];
  if (order.deliveredAt) {
    rightRows.push(["Delivery Date:", new Date(order.deliveredAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })]);
  }

  doc.fontSize(8.5).font("Helvetica");
  for (const [label, val] of rightRows) {
    doc.fillColor(LIGHT_GRAY).text(label, 300, rightY, { width: 100, align: "left" });
    if (label === "Payment Status:") {
      const isPaid = val === "PAID";
      doc.fillColor(isPaid ? SUCCESS_GREEN : DANGER_RED).font("Helvetica-Bold").text(val, 400, rightY, { width: 155, align: "right" });
    } else {
      doc.fillColor(DARK_GRAY).font("Helvetica-Bold").text(val, 400, rightY, { width: 155, align: "right" });
    }
    doc.font("Helvetica");
    rightY += 14;
  }

  // Horizontal gold border divider below header
  let headerEndY = Math.max(leftY, rightY) + 10;
  doc.strokeColor(GOLD).lineWidth(0.8).moveTo(40, headerEndY).lineTo(555, headerEndY).stroke();

  /* ==========================================================================
     2. BILLING & SHIPPING SECTIONS (Side-by-side columns)
     ========================================================================== */
  let addressY = headerEndY + 12;
  doc.fillColor(GOLD).fontSize(9.5).font("Helvetica-Bold").text("BILL TO (BUYER DETAILS)", 40, addressY);
  doc.text("SHIP TO (DELIVERY ADDRESS)", 300, addressY);
  addressY += 14;

  const billingLines = [
    `Customer Name: ${cleanText(order.customerName)}`,
    `Phone Number: ${cleanText(order.customerPhone)}`,
    `Email: ${cleanText(order.customerEmail)}`,
    `State: ${cleanText(order.shippingAddress.state)}`
  ];
  // Extract B2B GST if present in addressLine2
  const b2bGst = order.shippingAddress.addressLine2?.match(/GSTIN\s*:\s*([A-Z0-9]{15})/i)?.[1] || "";
  if (b2bGst) {
    billingLines.push(`GSTIN (B2B): ${b2bGst}`);
  }

  const shippingLines = [
    cleanText(order.shippingAddress.fullName),
    cleanText(order.shippingAddress.addressLine1)
  ];
  if (order.shippingAddress.addressLine2) {
    shippingLines.push(cleanText(order.shippingAddress.addressLine2));
  }
  shippingLines.push(`${cleanText(order.shippingAddress.city)}, ${cleanText(order.shippingAddress.state)} - ${cleanText(order.shippingAddress.pincode)}`);
  shippingLines.push(cleanText(order.shippingAddress.country || "India"));
  shippingLines.push(`Phone: ${cleanText(order.shippingAddress.phone || order.customerPhone)}`);

  doc.fontSize(8).fillColor(DARK_GRAY).font("Helvetica");
  
  let billCursorY = addressY;
  for (const line of billingLines) {
    doc.text(line, 40, billCursorY, { width: 240 });
    billCursorY += doc.heightOfString(line, { width: 240 }) + 3;
  }

  let shipCursorY = addressY;
  for (const line of shippingLines) {
    doc.text(line, 300, shipCursorY, { width: 255 });
    shipCursorY += doc.heightOfString(line, { width: 255 }) + 3;
  }

  let addressEndY = Math.max(billCursorY, shipCursorY) + 12;

  /* ==========================================================================
     3. ORDERED PRODUCTS TABLE (Dynamic Row Height & Page-break check)
     ========================================================================== */
  doc.fillColor(GOLD).fontSize(9.5).font("Helvetica-Bold").text("PURCHASED Skincare PRODUCTS", 40, addressEndY);
  addressEndY += 14;

  let tableY = addressEndY;

  const drawTableHeader = (yPos) => {
    doc.rect(40, yPos, 515, 20).fill(GOLD);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(7.5);
    doc.text("IMAGE", 42, yPos + 6);
    doc.text("PRODUCT NAME", 80, yPos + 6);
    doc.text("SKU", 245, yPos + 6);
    doc.text("QTY", 305, yPos + 6, { width: 25, align: "center" });
    doc.text("MRP", 335, yPos + 6, { width: 40, align: "right" });
    doc.text("DISC", 380, yPos + 6, { width: 40, align: "right" });
    doc.text("GST", 425, yPos + 6, { width: 35, align: "right" });
    doc.text("PRICE", 465, yPos + 6, { width: 40, align: "right" });
    doc.text("TOTAL", 510, yPos + 6, { width: 45, align: "right" });
  };

  drawTableHeader(tableY);
  tableY += 20;

  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    const nameText = cleanText(item.productName);
    const skuText = `VC-${item.productId?.category?.slice(0,3).toUpperCase() || "SKN"}-${item.productId?._id.toString().slice(-6).toUpperCase() || "ITEM"}`;
    
    // Calculate heights for long names
    const textHeight = doc.heightOfString(nameText, { width: 160 }) + 14;
    const rowHeight = Math.max(38, textHeight);

    // Multi-page check
    if (tableY + rowHeight > 740) {
      doc.addPage();
      tableY = 40;
      drawTableHeader(tableY);
      tableY += 20;
    }

    // Row zebra stripes
    if (i % 2 === 1) {
      doc.rect(40, tableY, 515, rowHeight).fill("#FAF8F5");
    }

    // Image thumbnail with fast timeout
    const imgX = 42;
    const imgY = tableY + (rowHeight - 26) / 2;
    if (item.productId?.imageUrl) {
      try {
        const imgRes = await axios.get(item.productId.imageUrl, { responseType: "arraybuffer", timeout: 800 });
        const imgBuffer = Buffer.from(imgRes.data);
        doc.image(imgBuffer, imgX, imgY, { fit: [26, 26] });
      } catch (err) {
        // Fallback Vector box
        doc.rect(imgX, imgY, 26, 26).fill("#F3F4F6");
        doc.fillColor(GOLD).fontSize(6.5).font("Helvetica-Bold").text("VC", imgX, imgY + 10, { width: 26, align: "center" });
      }
    } else {
      doc.rect(imgX, imgY, 26, 26).fill("#F3F4F6");
      doc.fillColor(GOLD).fontSize(6.5).font("Helvetica-Bold").text("VC", imgX, imgY + 10, { width: 26, align: "center" });
    }

    doc.fillColor(DARK_GRAY).font("Helvetica").fontSize(7.2);
    doc.text(nameText, 80, tableY + (rowHeight - doc.heightOfString(nameText, { width: 160 })) / 2, { width: 160, lineGap: 1 });
    doc.text(skuText, 245, tableY + (rowHeight - doc.heightOfString(skuText, { width: 55 })) / 2, { width: 55 });
    doc.text(item.qty.toString(), 305, tableY + (rowHeight - 8) / 2, { width: 25, align: "center" });

    // Financial calculations per item
    const mrp = item.productId?.originalPrice || item.price * 1.25;
    const discountPerUnit = Math.max(0, mrp - item.price);
    const gstRate = 0.18; // 18% standard cosmetic GST
    const basePrice = item.price / (1 + gstRate);

    doc.text(formatPrice(mrp), 335, tableY + (rowHeight - 8) / 2, { width: 40, align: "right" });
    doc.text(formatPrice(discountPerUnit), 380, tableY + (rowHeight - 8) / 2, { width: 40, align: "right" });
    doc.text("18%", 425, tableY + (rowHeight - 8) / 2, { width: 35, align: "right" });
    doc.text(formatPrice(basePrice), 465, tableY + (rowHeight - 8) / 2, { width: 40, align: "right" });
    doc.text(formatPrice(item.price * item.qty), 510, tableY + (rowHeight - 8) / 2, { width: 45, align: "right" });

    doc.strokeColor(ACCENT_BORDER).lineWidth(0.5).moveTo(40, tableY + rowHeight).lineTo(555, tableY + rowHeight).stroke();
    tableY += rowHeight;
  }

  /* ==========================================================================
     4. SUMMARY & TRUST & PAYMENT BLOCKS (A4 grid split)
     ========================================================================== */
  if (tableY + 160 > 740) {
    doc.addPage();
    tableY = 40;
  }

  let summaryY = tableY + 15;

  // Left Section - QR Code & Payment
  doc.roundedRect(40, summaryY, 240, 68, 6).fillAndStroke(SOFT_BG, ACCENT_BORDER);
  
  let qrBuffer = null;
  try {
    const trackingUrl = `https://venuscare.com/order/${order._id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(trackingUrl)}`;
    const qrRes = await axios.get(qrUrl, { responseType: "arraybuffer", timeout: 800 });
    qrBuffer = Buffer.from(qrRes.data);
    doc.image(qrBuffer, 48, summaryY + 9, { width: 50, height: 50 });
  } catch (err) {
    doc.strokeColor(GOLD).lineWidth(0.5).rect(48, summaryY + 9, 50, 50).stroke();
    doc.fillColor(GOLD).fontSize(6).font("Helvetica-Bold").text("SCAN", 48, summaryY + 30, { width: 50, align: "center" });
  }

  doc.fillColor(DARK_GRAY).fontSize(8).font("Helvetica-Bold").text("Scan to Track Shipment", 108, summaryY + 12);
  doc.fontSize(7).font("Helvetica").fillColor(LIGHT_GRAY).text("Point your phone camera at the QR code to track delivery progress, verify authentic formulas, or request exchanges.", 108, summaryY + 23, { width: 165, lineGap: 1.5 });

  // Payment Block
  let paymentBlockY = summaryY + 76;
  doc.roundedRect(40, paymentBlockY, 240, 70, 6).fillAndStroke(SOFT_BG, ACCENT_BORDER);

  doc.fillColor(GOLD).fontSize(8.5).font("Helvetica-Bold").text("PAYMENT LOGISTICS", 52, paymentBlockY + 10);
  doc.fontSize(7.5).font("Helvetica");

  doc.fillColor(LIGHT_GRAY).text("Gateway/Mode:", 52, paymentBlockY + 24);
  doc.fillColor(DARK_GRAY).font("Helvetica-Bold").text(order.paymentMethod.toUpperCase(), 150, paymentBlockY + 24);

  doc.fillColor(LIGHT_GRAY).font("Helvetica").text("Txn Identifier:", 52, paymentBlockY + 38);
  doc.fillColor(DARK_GRAY).font("Helvetica-Bold").text(order.paymentId || "COD_PENDING", 150, paymentBlockY + 38, { width: 125 });

  doc.fillColor(LIGHT_GRAY).font("Helvetica").text("Fulfillment Status:", 52, paymentBlockY + 52);
  const paymentPaid = order.paymentStatus === "Paid";
  doc.fillColor(paymentPaid ? SUCCESS_GREEN : DANGER_RED).font("Helvetica-Bold").text(order.paymentStatus.toUpperCase(), 150, paymentBlockY + 52);

  // Right Section - Financial Summary
  doc.roundedRect(300, summaryY, 255, 146, 6).fillAndStroke(SOFT_BG, GOLD);
  let itemSummaryY = summaryY + 12;

  doc.fillColor(GOLD).fontSize(9.5).font("Helvetica-Bold").text("ORDER TAX BREAKDOWN", 312, itemSummaryY);
  itemSummaryY += 16;
  doc.fontSize(7.5).font("Helvetica");

  const mrpTotal = order.items.reduce((sum, item) => {
    const mrp = item.productId?.originalPrice || item.price * 1.25;
    return sum + (mrp * item.qty);
  }, 0);
  const itemsPriceTotal = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const itemsDiscount = Math.max(0, mrpTotal - itemsPriceTotal);
  const couponDiscount = Math.max(0, itemsPriceTotal + order.shippingCharge - order.totalAmount);
  
  const taxRate = 0.18;
  const taxableAmount = order.totalAmount / (1 + taxRate);
  const gstTotal = order.totalAmount - taxableAmount;
  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;

  const summaryData = [
    ["Total Gross MRP Value", formatPrice(mrpTotal)],
    ["Promotional Discount", `- ${formatPrice(itemsDiscount)}`, SUCCESS_GREEN],
    ["Coupon Discount", couponDiscount > 0 ? `- ${formatPrice(couponDiscount)}` : "Rs. 0.00", couponDiscount > 0 ? SUCCESS_GREEN : DARK_GRAY],
    ["Fulfillment Shipping Charge", order.shippingCharge > 0 ? formatPrice(order.shippingCharge) : "FREE"],
    ["Taxable Invoice Value", formatPrice(taxableAmount)],
    ["CGST Tax (9%)", formatPrice(cgst)],
    ["SGST Tax (9%)", formatPrice(sgst)],
    ["Grand Total (Incl. GST)", formatPrice(order.totalAmount), DARK_GRAY, true],
    ["Total Paid To Date", formatPrice(order.paymentStatus === "Paid" ? order.totalAmount : 0), SUCCESS_GREEN, true],
    ["Balance Outstanding Due", formatPrice(order.paymentStatus === "Paid" ? 0 : order.totalAmount), order.paymentStatus === "Paid" ? DARK_GRAY : DANGER_RED, true]
  ];

  for (const [label, val, color, isBold] of summaryData) {
    doc.fillColor(LIGHT_GRAY).text(label, 312, itemSummaryY);
    doc.fillColor(color || DARK_GRAY)
       .font(isBold ? "Helvetica-Bold" : "Helvetica")
       .text(val, 470, itemSummaryY, { width: 75, align: "right" });
    doc.font("Helvetica");
    itemSummaryY += 11;
  }

  /* ==========================================================================
     5. LEGAL DISCLAIMER & FOOTER
     ========================================================================== */
  let currentY = Math.max(summaryY + 152, paymentBlockY + 72);
  if (currentY + 100 > 740) {
    doc.addPage();
    currentY = 40;
  } else {
    currentY += 15;
  }

  doc.strokeColor(GOLD).lineWidth(0.8).moveTo(40, currentY).lineTo(555, currentY).stroke();
  currentY += 12;

  doc.fillColor(GOLD).fontSize(10).font("Helvetica-Bold").text("THANK YOU FOR CHOOSING VENUS CARE!", 40, currentY, { align: "center" });
  currentY += 16;

  doc.fillColor(LIGHT_GRAY).fontSize(7.5).font("Helvetica").text("Return Policy: 7-day returns on unopened formulations. To return, scan the QR code above or visit Profile > Orders.", 40, currentY, { align: "center", width: 515 });
  currentY += 12;

  doc.text("Support Helpline: +91 1800-555-VENUS   |   Email: care@venuscare.com   |   Web: www.venuscare.com", 40, currentY, { align: "center", width: 515 });
  currentY += 12;

  doc.fontSize(6.8).fillColor("#9CA3AF").text("This is a digitally generated tax invoice valid under the CGST Act 2017. All disputes are subject to Venus Retail Mumbai Jurisdiction.", 40, currentY, { align: "center", width: 515 });

  /* ==========================================================================
     6. DYNAMIC PAGE NUMBERING
     ========================================================================== */
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor("#9CA3AF").fontSize(7.5).text(
      `Page ${i + 1} of ${range.count}`,
      40,
      805,
      { align: "right", width: 515 }
    );
  }

  doc.end();
};

module.exports = generateInvoice;
