const PDFDocument = require("pdfkit");

const generateInvoice = (order, res) => {
  const formatPrice = (amount) => `Rs. ${amount}`;
  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
  });

  //   Response Headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${order._id}.pdf`,
  );

  doc.pipe(res);

  /* =========================
      COMPANY HEADER
  ========================= */
  doc.fontSize(30).fillColor("#C8A96B").font("Helvetica-Bold").text("VENUS", {
    align: "center",
  });

  doc
    .fontSize(11)
    .fillColor("#666666")
    .font("Helvetica")
    .text("Premium Luxury Skincare", {
      align: "center",
    });

  doc.moveDown(2);

  // doc
  //   .strokeColor("#C8A96B")
  //   .lineWidth(1)
  //   .moveTo(50, doc.y)
  //   .lineTo(550, doc.y)
  //   .stroke();

  doc.moveDown();
  doc
    .strokeColor("#C8A96B")
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke();

  doc.moveDown();

  const invoiceNumber = `INV-${new Date().getFullYear()}-${order._id
    .toString()
    .slice(-6)
    .toUpperCase()}`;

  const invoiceY = doc.y;

  doc.roundedRect(50, invoiceY, 500, 80, 8).fillAndStroke("#FAFAFA", "#E5E5E5");

  doc.fillColor("black");

  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("INVOICE", 70, invoiceY + 15);

  doc.fontSize(11).font("Helvetica");
  // .text(`Invoice #: ${invoiceNumber}`, 350, invoiceY + 15);

  doc.roundedRect(360, invoiceY + 10, 160, 25, 5).fill("#C8A96B");

  doc
    .fillColor("white")
    .font("Helvetica-Bold")
    .text(invoiceNumber, 370, invoiceY + 17);

  doc.fillColor("black");

  doc.text(
    `Date: ${new Date(order.createdAt).toLocaleDateString()}`,
    350,
    invoiceY + 35,
  );

  doc.text(`Order ID: ${order._id}`, 350, invoiceY + 55);

  doc.y = invoiceY + 100;

  /* =========================
      INVOICE DETAILS
  ========================= */

  /* =========================
      CUSTOMER DETAILS
  ========================= */

  /* =========================
      SHIPPING ADDRESS
  ========================= */

  const startY = doc.y;

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#C8A96B")
    .text("BILL TO", 50, startY);

  // doc
  //   .fontSize(11)
  //   .fillColor("black")
  //   .font("Helvetica")
  //   .text(order.customerName)
  //   .text(order.customerEmail)
  //   .text(order.customerPhone);

  doc.fontSize(11).fillColor("black").font("Helvetica");

  doc.text(`Name: ${order.customerName}`, 50, startY + 20);

  doc.text(`Email: ${order.customerEmail}`, 50, startY + 40);

  doc.text(`Phone: ${order.customerPhone}`, 50, startY + 60);

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#C8A96B")
    .text("SHIP TO", 320, startY);

  doc.fontSize(11).fillColor("black").font("Helvetica");
  // .text(order.shippingAddress.fullName, 320)
  // .text(order.shippingAddress.phone)
  // .text(order.shippingAddress.addressLine1);

  doc.text(order.shippingAddress.fullName, 320, startY + 20);

  doc.text(order.shippingAddress.phone, 320, startY + 40);

  doc.text(order.shippingAddress.addressLine1, 320, startY + 60);

  if (order.shippingAddress.addressLine2) {
    doc.text(order.shippingAddress.addressLine2);
  }

  doc
    .text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`)
    .text(`${order.shippingAddress.pincode}, ${order.shippingAddress.country}`);

  doc.moveDown(3);

  /* =========================
      PRODUCTS
  ========================= */

  doc.fontSize(16).font("Helvetica-Bold").text("Products");

  doc.moveDown();

  let y = doc.y + 10;

  doc.font("Helvetica-Bold");

  // doc.text("Product", 50, y);
  // doc.text("Qty", 260, y);
  // doc.text("Price", 330, y);
  // doc.text("Total", 430, y);

  doc.rect(50, y - 5, 500, 25).fill("#C8A96B");

  doc.fillColor("white");
  doc.font("Helvetica-Bold");

  doc.text("Product", 60, y);
  doc.text("Qty", 270, y);
  doc.text("Price", 350, y);
  doc.text("Total", 460, y);

  doc.fillColor("black");

  y += 20;

  doc.moveTo(50, y).lineTo(550, y).stroke();

  y += 15;

  order.items.forEach((item, index) => {
    // if (y > 700) {
    //   doc.addPage();
    //   y = 80;
    // }
    if (y > 700) {
      doc.addPage();

      y = 80;

      doc.rect(50, y - 5, 500, 25).fill("#C8A96B");

      doc.fillColor("white");

      doc.text("Product", 60, y);
      doc.text("Qty", 290, y);
      doc.text("Price", 370, y);
      doc.text("Total", 470, y);

      doc.fillColor("black");

      y += 40;
    }

    if (index % 2 === 0) {
      doc.save();
      doc.rect(50, y - 5, 500, 25).fill("#FAFAFA");
      doc.restore();
    }

    doc.fillColor("black");
    doc.font("Helvetica");

    doc.text(item.productName, 60, y, {
      // width: 180,
      width: 220,
    });

    doc.text(item.qty.toString(), 260, y, {
      width: 40,
      align: "center",
    });

    doc.text(`₹${item.price}`, 330, y, {
      width: 80,
      align: "right",
    });

    doc.text(`₹${item.qty * item.price}`, 440, y, {
      width: 80,
      align: "right",
    });

    y += 25;
  });

  const summaryStartY = y + 30;
  /* =========================
      ORDER SUMMARY
  ========================= */
  doc.text("Order Summary", 50, summaryStartY);

  const summaryY = y + 40;

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor("#C8A96B")
    .text("Order Summary", 300, summaryY);

  doc.roundedRect(290, summaryY + 30, 260, 120, 8).stroke("#C8A96B");

  doc.fillColor("black");

  doc.text("Subtotal", 310, summaryY + 50);
  doc.text(`₹${order.subtotal}`, 500, summaryY + 50);

  doc.text("Shipping", 310, summaryY + 75);
  doc.text(`₹${order.shippingCharge}`, 500, summaryY + 75);

  doc.text("GST", 310, summaryY + 100);
  doc.text(`₹${order.taxAmount}`, 500, summaryY + 100);

  doc.font("Helvetica-Bold").fillColor("#C8A96B");

  doc.text("Grand Total", 310, summaryY + 125);
  // doc.text(`₹${order.totalAmount}`, 500, summaryY + 125);
  doc.text(formatPrice(order.totalAmount), 500, summaryY + 125);

  doc.fillColor("black");
  // doc.y = boxY + 160;
  const paymentY = summaryY + 190;

  /* =========================
      PAYMENT DETAILS
  ========================= */
  doc.text("Payment Details", 50, paymentY);

  doc.moveDown();

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor("#C8A96B")
    .text("Payment Details");

  doc.moveDown(0.5);

  doc.fontSize(11);
  doc.font("Helvetica");

  doc.fillColor("black");
  doc.text(`Payment Method: ${order.paymentMethod}`);

  let paymentColor = "#F59E0B";

  if (order.paymentStatus === "Paid") {
    paymentColor = "#16A34A";
  }

  if (order.paymentStatus === "Failed") {
    paymentColor = "#DC2626";
  }

  // doc.fillColor(paymentColor);
  // doc.text(`Payment Status: ${order.paymentStatus}`);

  doc.fillColor("black");
  doc.text("Payment Status:", 50, doc.y);

  const badgeY = doc.y - 15;

  doc.roundedRect(170, badgeY, 80, 20, 5).fill(paymentColor);

  doc
    .fillColor("white")
    .font("Helvetica-Bold")
    .text(order.paymentStatus, 180, badgeY + 5);

  doc.fillColor("black");

  doc.fillColor("#2563EB");
  doc.text(`Order Status: ${order.status}`);

  doc.fillColor("black");

  if (order.paymentId) {
    doc.text(`Payment ID: ${order.paymentId}`);
  }

  /* =========================
      FOOTER
  ========================= */

  doc.moveDown(2);

  doc.strokeColor("#C8A96B").moveTo(50, doc.y).lineTo(550, doc.y).stroke();

  doc.moveDown();

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor("#C8A96B")
    .text("Thank You For Shopping With VENUS", {
      align: "center",
    });

  doc
    .fontSize(10)
    .fillColor("#666666")
    .font("Helvetica")
    .text("Premium Luxury Skincare", {
      align: "center",
    });

  // doc.text("www.elysoria.com", {
  //   align: "center",
  // });

  doc.text("neelpatel8422@gmil.com", {
    align: "center",
  });

  doc.text("www.venus.com", {
    align: "center",
  });

  doc.text(
    "This is a computer generated invoice and does not require a signature.",
    {
      align: "center",
    },
  );
  doc.end();
};

module.exports = generateInvoice;
