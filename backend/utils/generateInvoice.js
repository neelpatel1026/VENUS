const PDFDocument = require("pdfkit");
const axios = require("axios");

const generateInvoice = async (order, res) => {
  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
  });

  // Response Headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${order._id}.pdf`
  );

  doc.pipe(res);

  // Constants for Colors
  const GOLD = "#C8A96B";
  const DARK_GRAY = "#1F2937";
  const LIGHT_GRAY = "#6B7280";
  const SUCCESS_GREEN = "#166534";
  const SOFT_BG = "#FDFBF7";

  // Reusable format function - Safe ASCII Currency character 'Rs.' to prevent PDFKit font rendering errors
  const formatPrice = (amount) => `Rs. ${parseFloat(amount).toFixed(2)}`;

  /* ==========================================================================
     1. COMPANY HEADER & BRANDING
     ========================================================================== */
  doc
    .fontSize(28)
    .fillColor(GOLD)
    .font("Helvetica-Bold")
    .text("VENUS CARE", { align: "center" });

  doc
    .fontSize(10)
    .fillColor(LIGHT_GRAY)
    .font("Helvetica-Oblique")
    .text("Premium Luxury Cosmetics", { align: "center" });

  doc.moveDown(1.2);

  // Soft Divider
  doc
    .strokeColor(GOLD)
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc.moveDown(0.8);

  /* ==========================================================================
     2. INVOICE INFO BOX (Header Card)
     ========================================================================== */
  const invoiceNumber = `INV-${new Date(order.createdAt).getFullYear()}-${order._id
    .toString()
    .slice(-6)
    .toUpperCase()}`;

  const infoY = doc.y;

  // Background Box
  doc
    .roundedRect(50, infoY, 495, 75, 8)
    .fillAndStroke(SOFT_BG, "#E5E5E5");

  doc.fillColor(DARK_GRAY);

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("TAX INVOICE", 70, infoY + 18);

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Invoice # :  ${invoiceNumber}`, 70, infoY + 42);

  // Right details info
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Order Date :  ${new Date(order.createdAt).toLocaleDateString()}`, 330, infoY + 18, { width: 200 });

  doc.text(`Order ID :  #${order._id.toString().toUpperCase()}`, 330, infoY + 33, { width: 200 });
  doc.text("GSTIN :  27AAEFC9401F1Z2 (Venus Retail)", 330, infoY + 48, { width: 200 });

  doc.y = infoY + 90;

  /* ==========================================================================
     3. BILLING & SHIPPING DETAILS (Dynamic Heights Card Calculation)
     ========================================================================== */
  const cardY = doc.y;
  const cardWidth = 235;

  // Build exact text strings to measure string heights safely
  const billText = `Name: ${order.customerName}\n📞 Phone: ${order.customerPhone}\n✉ Email: ${order.customerEmail}`;
  
  let shipAddressText = `${order.shippingAddress.fullName}\n${order.shippingAddress.addressLine1}`;
  if (order.shippingAddress.addressLine2) {
    shipAddressText += `\n${order.shippingAddress.addressLine2}`;
  }
  shipAddressText += `\n${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}\n${order.shippingAddress.country || "India"}`;

  // Measure heights with safety paddings
  const measuredBillHeight = doc.heightOfString(billText, { width: cardWidth - 30 }) + 32;
  const measuredShipHeight = doc.heightOfString(shipAddressText, { width: cardWidth - 30 }) + 32;
  const cardHeight = Math.max(110, measuredBillHeight, measuredShipHeight);

  // Render billing box
  doc
    .roundedRect(50, cardY, cardWidth, cardHeight, 8)
    .fillAndStroke(SOFT_BG, "#ECE5DA");

  doc.fillColor(GOLD);
  doc.fontSize(11).font("Helvetica-Bold").text("BILL TO (CUSTOMER)", 65, cardY + 12);
  doc.fillColor(DARK_GRAY).fontSize(9.5).font("Helvetica").text(billText, 65, cardY + 30, { width: cardWidth - 30, lineGap: 3 });

  // Render shipping box
  doc
    .roundedRect(310, cardY, cardWidth, cardHeight, 8)
    .fillAndStroke(SOFT_BG, "#ECE5DA");

  doc.fillColor(GOLD);
  doc.fontSize(11).font("Helvetica-Bold").text("SHIP TO (DELIVERY ADDRESS)", 325, cardY + 12);
  doc.fillColor(DARK_GRAY).fontSize(9.5).font("Helvetica").text(shipAddressText, 325, cardY + 30, { width: cardWidth - 30, lineGap: 3 });

  doc.y = cardY + cardHeight + 20;

  /* ==========================================================================
     4. PRODUCT ITEMS TABLE (Dynamic Row Spacing & Multi-Page break checks)
     ========================================================================== */
  doc.fontSize(13).font("Helvetica-Bold").fillColor(DARK_GRAY).text("Purchased Items", 50, doc.y);
  doc.moveDown(0.4);

  let tableY = doc.y;

  // Render Header function
  const drawTableHeader = (yPos) => {
    doc.rect(50, yPos, 495, 25).fill(GOLD);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(9.5);
    doc.text("Product Details", 65, yPos + 8);
    doc.text("Qty", 270, yPos + 8, { width: 40, align: "center" });
    if (!order.giftReceipt) {
      doc.text("Unit Price", 330, yPos + 8, { width: 90, align: "right" });
      doc.text("Total Amount", 440, yPos + 8, { width: 90, align: "right" });
    } else {
      doc.text("Gift Item", 380, yPos + 8, { width: 150, align: "right" });
    }
  };

  drawTableHeader(tableY);
  tableY += 25;

  order.items.forEach((item, index) => {
    // Dynamic text height measurement for long product names
    const productNameHeight = doc.heightOfString(item.productName, { width: 200 }) + 12;
    const rowHeight = Math.max(28, productNameHeight);

    // Multi-page safety overflow check: if row extends past page end (700 pt)
    if (tableY + rowHeight > 700) {
      doc.addPage();
      tableY = 50;
      drawTableHeader(tableY);
      tableY += 25;
    }

    // Alternate row styling
    if (index % 2 === 0) {
      doc.rect(50, tableY, 495, rowHeight).fill("#FCFAF5");
    }

    doc.fillColor(DARK_GRAY).font("Helvetica").fontSize(9.2);

    // Render columns
    doc.text(item.productName, 65, tableY + 8, { width: 200, lineGap: 2 });
    doc.text(item.qty.toString(), 270, tableY + 8, { width: 40, align: "center" });
    if (!order.giftReceipt) {
      doc.text(formatPrice(item.price), 330, tableY + 8, { width: 90, align: "right" });
      doc.text(formatPrice(item.qty * item.price), 440, tableY + 8, { width: 90, align: "right" });
    } else {
      doc.text("Gift packaging", 380, tableY + 8, { width: 150, align: "right" });
    }

    tableY += rowHeight;
  });

  doc.y = tableY + 20;

  /* ==========================================================================
     5. ORDER SUMMARY & TRUST CORNER (Page break safety check)
     ========================================================================== */
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalSavings = Math.max(0, subtotal - order.totalAmount);

  // If summary boxes (height ~ 130 pt) clash with page end, push to a fresh page
  if (doc.y + 130 > 700) {
    doc.addPage();
  }

  const currentSummaryY = doc.y;

  // Fetch Verification QR Code buffer from API
  let qrBuffer = null;
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Order-${order._id}`;
    const qrRes = await axios.get(qrUrl, { responseType: "arraybuffer", timeout: 2000 });
    qrBuffer = Buffer.from(qrRes.data);
  } catch (err) {
    console.error("Failed to load QR code over network:", err.message);
  }

  // Draw QR code card & badges
  doc.roundedRect(50, currentSummaryY, 235, 115, 8).fillAndStroke(SOFT_BG, "#E5E5E5");
  if (qrBuffer) {
    doc.image(qrBuffer, 65, currentSummaryY + 12, { width: 60, height: 60 });
  } else {
    // Offline Vector QR outline fallback
    doc
      .strokeColor(GOLD)
      .lineWidth(1)
      .roundedRect(65, currentSummaryY + 12, 60, 60, 4)
      .stroke();
    
    doc.fillColor(GOLD).fontSize(7.5).font("Helvetica-Bold").text("VERIFIED", 65, currentSummaryY + 38, { width: 60, align: "center" });
  }

  doc.fillColor(DARK_GRAY).fontSize(8.5).font("Helvetica-Bold").text("Verification QR Code", 138, currentSummaryY + 18);
  doc.fontSize(7.5).font("Helvetica").fillColor(LIGHT_GRAY).text("Scan this code to verify your parcel details and view order dispatch manifests.", 138, currentSummaryY + 32, { width: 132, lineGap: 1 });
  
  // Reassurance badges
  doc.fillColor(GOLD).fontSize(8.5).font("Helvetica-Bold").text("🛡 100% Genuine  •  🚚 Fast Shipping  •  ↩ 7-Day Returns", 60, currentSummaryY + 95);

  // Right card: Summary breakdown
  doc.roundedRect(310, currentSummaryY, 235, 115, 8).fillAndStroke(SOFT_BG, GOLD);
  
  doc.fillColor(GOLD).fontSize(11).font("Helvetica-Bold").text("ORDER SUMMARY", 325, currentSummaryY + 12);
  doc.fillColor(DARK_GRAY).fontSize(9.5).font("Helvetica");

  if (!order.giftReceipt) {
    doc.text("Subtotal", 325, currentSummaryY + 32);
    doc.text(formatPrice(subtotal), 440, currentSummaryY + 32, { width: 90, align: "right" });

    doc.text("Shipping Charge", 325, currentSummaryY + 48);
    doc.text("FREE", 440, currentSummaryY + 48, { width: 90, align: "right" });

    if (totalSavings > 0) {
      doc.fillColor(SUCCESS_GREEN).font("Helvetica-Bold").text("Total Discount", 325, currentSummaryY + 64);
      doc.text(`-${formatPrice(totalSavings)}`, 440, currentSummaryY + 64, { width: 90, align: "right" });
    }

    doc.fillColor(DARK_GRAY).font("Helvetica-Bold");
    doc.text("Paid Grand Total", 325, currentSummaryY + 88);
    doc.text(formatPrice(order.totalAmount), 440, currentSummaryY + 88, { width: 90, align: "right" });
  } else {
    doc.fillColor(DARK_GRAY).font("Helvetica-Bold").fontSize(9).text("GIFT RECEIPT - PRICE HIDDEN", 320, currentSummaryY + 30, { width: 215, align: "center" });
    doc.fontSize(7.5).font("Helvetica").fillColor(LIGHT_GRAY).text("Prices have been hidden from this package inside invoice at the customer's request.", 320, currentSummaryY + 44, { width: 215, align: "center", lineGap: 1 });
    
    if (order.giftMessage) {
      doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8).text("GIFT MESSAGE:", 320, currentSummaryY + 70, { width: 215, align: "center" });
      doc.fillColor(DARK_GRAY).font("Helvetica-Oblique").fontSize(8).text(`"${order.giftMessage}"`, 320, currentSummaryY + 82, { width: 215, align: "center" });
    }
  }

  doc.y = currentSummaryY + 130;

  /* ==========================================================================
     6. PAYMENT VERIFICATION BAR
     ========================================================================== */
  if (doc.y + 60 > 700) {
    doc.addPage();
  }

  const paymentBoxY = doc.y;
  doc.roundedRect(50, paymentBoxY, 495, 45, 6).fillAndStroke(SOFT_BG, "#E5E5E5");

  doc.fillColor(DARK_GRAY).fontSize(9).font("Helvetica-Bold").text("Payment Method :", 70, paymentBoxY + 17);
  doc.font("Helvetica").text(order.paymentMethod, 160, paymentBoxY + 17);

  doc.font("Helvetica-Bold").text("Status :", 230, paymentBoxY + 17);
  
  const statusColor = order.paymentStatus === "Paid" ? SUCCESS_GREEN : "#B59453";
  doc.fillColor(statusColor).text(order.paymentStatus, 275, paymentBoxY + 17);

  doc.fillColor(DARK_GRAY).font("Helvetica-Bold").text("Txn ID :", 340, paymentBoxY + 17);
  doc.font("Helvetica").text(order.paymentId || "COD_PENDING", 380, paymentBoxY + 17, { width: 150 });

  doc.y = paymentBoxY + 60;

  /* ==========================================================================
     7. PROFESSIONAL FOOTER
     ========================================================================== */
  if (doc.y + 70 > 700) {
    doc.addPage();
  }

  doc.moveDown(0.8);
  doc
    .strokeColor(GOLD)
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc.moveDown(0.8);

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor(GOLD)
    .text("Thank You For Your Purchase!", { align: "center" });

  doc
    .fontSize(8.5)
    .fillColor(LIGHT_GRAY)
    .font("Helvetica")
    .text("If you have any questions about this invoice, contact our support team.", { align: "center" });

  doc.moveDown(0.5);

  doc
    .fontSize(8)
    .fillColor(LIGHT_GRAY)
    .text("Support Email: care@venuscare.com  •  Helpline: +1 (800) 555-VENUS  •  www.venuscare.com", { align: "center" });

  doc.text("This is a system-generated statement and does not require physical signatures.", { align: "center" });

  doc.end();
};

module.exports = generateInvoice;
