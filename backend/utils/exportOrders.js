const ExcelJS = require("exceljs");

const exportOrders = async (orders, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Orders Report");

  worksheet.columns = [
    { header: "Order ID", key: "orderId", width: 30 },
    { header: "Customer Name", key: "customer", width: 25 },
    { header: "Customer Email", key: "email", width: 30 },
    { header: "Customer Phone", key: "phone", width: 18 },
    { header: "Address Line 1", key: "address1", width: 30 },
    { header: "Address Line 2", key: "address2", width: 30 },
    { header: "City", key: "city", width: 15 },
    { header: "State", key: "state", width: 15 },
    { header: "Country", key: "country", width: 15 },
    { header: "Pincode", key: "pincode", width: 12 },
    { header: "Products", key: "products", width: 40 },
    { header: "Quantity", key: "quantity", width: 12 },
    { header: "Price (Subtotal)", key: "subtotal", width: 18 },
    { header: "Discount", key: "discount", width: 12 },
    { header: "Coupon", key: "coupon", width: 15 },
    { header: "Shipping Charge", key: "shipping", width: 15 },
    { header: "Payment Method", key: "paymentMethod", width: 18 },
    { header: "Payment Status", key: "paymentStatus", width: 18 },
    { header: "Order Status", key: "orderStatus", width: 18 },
    { header: "Return Status", key: "returnStatus", width: 15 },
    { header: "Refund Status", key: "refundStatus", width: 15 },
    { header: "Tracking Number", key: "trackingNumber", width: 18 },
    { header: "Courier Partner", key: "courierPartner", width: 18 },
    { header: "Order Date", key: "orderDate", width: 18 },
    { header: "Delivery Date", key: "deliveryDate", width: 18 },
    { header: "GST Amount", key: "gstAmount", width: 15 },
    { header: "Total Amount", key: "totalAmount", width: 18 },
  ];

  orders.forEach((order) => {
    const products = order.items.map((item) => item.productName).join(", ");
    const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);

    worksheet.addRow({
      orderId: order._id.toString(),
      customer: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address1: order.shippingAddress?.addressLine1 || "",
      address2: order.shippingAddress?.addressLine2 || "",
      city: order.shippingAddress?.city || "",
      state: order.shippingAddress?.state || "",
      country: order.shippingAddress?.country || "",
      pincode: order.shippingAddress?.pincode || "",
      products,
      quantity: totalQty,
      subtotal: order.subtotal || 0,
      discount: order.discount || 0,
      coupon: order.couponCode || "None",
      shipping: order.shippingCharge || 0,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      returnStatus: order.status === "Returned" ? "Returned" : "N/A",
      refundStatus: order.paymentStatus === "Refunded" ? "Refunded" : "N/A",
      trackingNumber: order.trackingNumber || "N/A",
      courierPartner: order.courierPartner || "N/A",
      orderDate: new Date(order.createdAt).toLocaleDateString(),
      deliveryDate: order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : "N/A",
      gstAmount: order.taxAmount || 0,
      totalAmount: order.totalAmount,
    });
  });

  // Freeze First Row
  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  // Style Headers
  const headerRow = worksheet.getRow(1);
  headerRow.font = {
    name: "Segoe UI",
    bold: true,
    color: { argb: "FFFFFF" },
    size: 11
  };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "C8A165" } // Gold accent
  };
  headerRow.alignment = {
    vertical: "middle",
    horizontal: "center"
  };
  headerRow.height = 28;

  // Format currency
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.font = { name: "Segoe UI", size: 10 };
      row.getCell("subtotal").numFmt = '"₹"#,##0.00';
      row.getCell("discount").numFmt = '"₹"#,##0.00';
      row.getCell("shipping").numFmt = '"₹"#,##0.00';
      row.getCell("gstAmount").numFmt = '"₹"#,##0.00';
      row.getCell("totalAmount").numFmt = '"₹"#,##0.00';
    }
  });

  // Auto Column Widths
  worksheet.columns.forEach((col) => {
    let maxLen = col.header.length;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const val = cell.value ? String(cell.value) : "";
      if (val.length > maxLen) {
        maxLen = val.length;
      }
    });
    col.width = Math.min(Math.max(maxLen + 4, 12), 50);
  });

  const d = new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Orders_${dateStr}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
};

module.exports = exportOrders;
