const ExcelJS = require("exceljs");

const exportOrders = async (orders, res) => {
  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet("Orders");

  worksheet.columns = [
    {
      header: "Order ID",
      key: "orderId",
      width: 30,
    },
    {
      header: "Customer",
      key: "customer",
      width: 25,
    },
    {
      header: "Email",
      key: "email",
      width: 30,
    },
    {
      header: "Phone",
      key: "phone",
      width: 18,
    },
    {
      header: "Address",
      key: "address",
      width: 50,
    },
    {
      header: "Products",
      key: "products",
      width: 40,
    },
    {
      header: "Quantity",
      key: "quantity",
      width: 12,
    },
    {
      header: "Amount",
      key: "amount",
      width: 15,
    },
    {
      header: "Payment",
      key: "payment",
      width: 15,
    },
    {
      header: "Status",
      key: "status",
      width: 20,
    },
    {
      header: "Date",
      key: "date",
      width: 18,
    },
  ];

  orders.forEach((order) => {
    const products = order.items.map((item) => item.productName).join(", ");

    const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);

    worksheet.addRow({
      orderId: order._id.toString(),

      customer: order.customerName,

      email: order.customerEmail,

      phone: order.customerPhone,

      address:
        `${order.shippingAddress.addressLine1}, ` +
        `${order.shippingAddress.city}, ` +
        `${order.shippingAddress.state} - ` +
        `${order.shippingAddress.pincode}`,

      products,

      quantity: totalQty,

      amount: order.totalAmount,

      payment: order.paymentMethod,

      status: order.status,

      date: new Date(order.createdAt).toLocaleDateString(),
    });
  });

  worksheet.getRow(1).font = {
    bold: true,
  };
  worksheet.getRow(1).alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  worksheet.getRow(1).height = 25;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");

  await workbook.xlsx.write(res);

  res.end();
};

module.exports = exportOrders;
