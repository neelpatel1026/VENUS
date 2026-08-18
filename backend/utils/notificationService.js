const sendEmail = require("./sendEmail.js");
const smsService = require("../services/smsService");
const NotificationLog = require("../models/NotificationLog");

/**
 * In-Flight Concurrency Lock Set (Prevents microsecond race conditions on parallel requests)
 */
const inFlightDispatches = new Set();

/**
 * Centralized Transactional Notification Events Enum
 */
const NOTIFICATION_EVENTS = {
  ORDER_PLACED: "ORDER_PLACED",
  PAYMENT_SUCCESSFUL: "PAYMENT_SUCCESSFUL",
  ORDER_CONFIRMED: "ORDER_CONFIRMED",
  ORDER_PACKED: "ORDER_PACKED",
  ORDER_SHIPPED: "ORDER_SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  RETURN_REQUESTED: "RETURN_REQUESTED",
  RETURN_APPROVED: "RETURN_APPROVED",
  REFUND_COMPLETED: "REFUND_COMPLETED",
};

/**
 * List of Events Enabled for SMS Broadcast
 */
const SMS_ENABLED_EVENTS = [
  NOTIFICATION_EVENTS.ORDER_PLACED,
  NOTIFICATION_EVENTS.PAYMENT_SUCCESSFUL,
  NOTIFICATION_EVENTS.ORDER_CONFIRMED,
  NOTIFICATION_EVENTS.ORDER_SHIPPED,
  NOTIFICATION_EVENTS.OUT_FOR_DELIVERY,
  NOTIFICATION_EVENTS.ORDER_DELIVERED,
  NOTIFICATION_EVENTS.RETURN_APPROVED,
  NOTIFICATION_EVENTS.REFUND_COMPLETED,
];

/**
 * Standard Branded Luxury Reusable HTML Email Template
 */
const generateEmailHtml = ({
  title,
  greeting,
  bodyContent,
  actionButtonsHtml = "",
  timelineHtml = "",
  orderSummaryHtml = "",
}) => {
  const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const contactNumber = "+91 63538 31965";
  const supportEmail = "venuscareofficial@gmail.com";

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      min-width: 100%;
      background-color: #FAFAFA;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #FAFAFA;
      padding-bottom: 40px;
    }
    .main {
      background-color: #FFFFFF;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-spacing: 0;
      font-family: sans-serif;
      color: #1A1A1A;
      border-radius: 20px;
      border: 1px solid #ECE7DF;
      overflow: hidden;
      margin-top: 40px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
    }
    .header {
      padding: 30px 0;
      text-align: center;
      background-color: #FFFFFF;
      border-bottom: 1px solid #FAF9F6;
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 20px;
      font-weight: bold;
      color: #1A1A1A;
      margin-bottom: 20px;
      font-family: 'Cinzel', 'Georgia', serif;
      text-align: center;
      letter-spacing: 1px;
    }
    .greeting {
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 15px;
      color: #1A1A1A;
      font-weight: bold;
    }
    .text {
      font-size: 14.5px;
      line-height: 1.8;
      color: #4B5563;
      margin-bottom: 25px;
    }
    .timeline-box {
      margin: 25px 0;
      padding: 16px;
      background-color: #FAF9F6;
      border-radius: 12px;
      border: 1px solid #ECE7DF;
      text-align: center;
    }
    .timeline-title {
      font-size: 11.5px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #8B7355;
      margin-bottom: 12px;
    }
    .details-box {
      background-color: #FFFFFF;
      border: 1px solid #ECE7DF;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 25px;
    }
    .details-title {
      font-size: 13px;
      font-weight: bold;
      color: #1A1A1A;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid #EFECE6;
      padding-bottom: 8px;
    }
    .detail-row {
      margin-bottom: 8px;
      font-size: 13.5px;
      line-height: 1.6;
      color: #4B5563;
    }
    .detail-label {
      font-weight: bold;
      color: #1A1A1A;
    }
    .btn-container {
      margin: 25px 0 10px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      padding: 12px 26px;
      margin: 6px;
      color: #FFFFFF !important;
      background-color: #111112;
      border-radius: 30px;
      text-decoration: none;
      font-weight: bold;
      font-size: 12.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    .btn-gold {
      background-color: #C8A165;
      box-shadow: 0 4px 12px rgba(200, 161, 101, 0.25);
    }
    .btn-secondary {
      background-color: #FFFFFF;
      color: #111112 !important;
      border: 1px solid #ECE7DF;
      box-shadow: none;
    }
    .footer {
      background-color: #FAF9F6;
      padding: 28px 20px;
      text-align: center;
      font-size: 12.5px;
      color: #6B7280;
      line-height: 1.6;
      border-top: 1px solid #ECE7DF;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" width="100%">
      <tr>
        <td class="header">
          <h2 style="margin:0; font-family: 'Cinzel', 'Georgia', serif; letter-spacing: 2px; color: #1A1A1A;">VENUS CARE</h2>
          <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #C8A165;">Luxury Botanical Skincare</span>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="title">${title}</div>
          <div class="greeting">${greeting}</div>
          <div class="text">
            ${bodyContent}
          </div>
          
          ${timelineHtml}
          ${orderSummaryHtml}
          
          <div class="btn-container">
            ${actionButtonsHtml}
          </div>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <div style="margin-bottom: 12px;">
            <a href="${baseUrl}/shop" style="color: #C8A165; text-decoration: none; margin: 0 8px; font-weight: bold;">Store</a> |
            <a href="${baseUrl}/privacy-policy" style="color: #6B7280; text-decoration: none; margin: 0 8px;">Privacy Policy</a> |
            <a href="${baseUrl}/return-policy" style="color: #6B7280; text-decoration: none; margin: 0 8px;">Return Policy</a> |
            <a href="${baseUrl}/contact" style="color: #6B7280; text-decoration: none; margin: 0 8px;">Support</a>
          </div>
          <div style="font-size: 11.5px; color: #9CA3AF; margin-top: 10px;">
            Customer Care: ${supportEmail} | ${contactNumber}<br />
            &copy; ${new Date().getFullYear()} VENUS CARE. All rights reserved.
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
};

/**
 * Builds Order Items Table HTML for Transactional Emails
 */
const buildOrderSummaryHtml = (order) => {
  if (!order) return "";
  const orderId = order._id ? order._id.toString() : "N/A";
  const paymentMethod = order.paymentMethod || "COD";
  const totalAmount = Number(order.totalAmount || 0).toFixed(2);

  const productRows = (order.items || []).map((item) => `
    <tr style="border-bottom: 1px solid #FAF9F6;">
      <td style="padding: 10px 0; font-size: 13.5px; color: #374151;">
        ${item.productName} <span style="font-size: 11px; color: #9CA3AF;">(x${item.qty})</span>
      </td>
      <td style="padding: 10px 0; font-size: 13.5px; color: #111112; text-align: right; font-weight: bold;">
        ₹${(item.qty * item.price).toFixed(2)}
      </td>
    </tr>
  `).join("");

  return `
    <div class="details-box">
      <div class="details-title">Order Snapshot</div>
      <div class="detail-row"><span class="detail-label">Order Number:</span> #${orderId.slice(-8).toUpperCase()}</div>
      <div class="detail-row"><span class="detail-label">Payment Method:</span> ${paymentMethod}</div>
      <table width="100%" style="border-collapse: collapse; margin-top: 12px;">
        ${productRows}
        <tr style="border-top: 1px dashed #ECE7DF;">
          <td style="padding: 12px 0 0 0; font-size: 14px; font-weight: bold; color: #111112;">Grand Total</td>
          <td style="padding: 12px 0 0 0; font-size: 14px; font-weight: bold; color: #C8A165; text-align: right;">₹${totalAmount}</td>
        </tr>
      </table>
    </div>
  `;
};

/**
 * Builds Visual Progress Pill Bar for Order Tracking
 */
const buildTimelineHtml = (activeStatus) => {
  const steps = ["Pending", "Processing", "Packed", "Shipped", "Out For Delivery", "Delivered"];
  const currentIdx = steps.indexOf(activeStatus);
  if (currentIdx === -1) return "";

  const stepsHtml = steps.map((s, idx) => {
    const isCompleted = idx <= currentIdx;
    const isCurrent = idx === currentIdx;
    return `
      <span style="display: inline-block; margin: 3px; font-size: 9.5px; padding: 3px 8px; border-radius: 14px; 
                   background-color: ${isCurrent ? '#111112' : (isCompleted ? '#FAF7F2' : '#F3F4F6')}; 
                   color: ${isCurrent ? '#FFFFFF' : (isCompleted ? '#C8A165' : '#9CA3AF')}; 
                   font-weight: bold; border: 1px solid ${isCompleted ? '#C8A165' : '#E5E7EB'};">
        ${isCompleted ? '✓' : '○'} ${s === "Pending" ? "Placed" : s}
      </span>
    `;
  }).join(" ");

  return `
    <div class="timeline-box">
      <div class="timeline-title">Order Progress</div>
      <div style="line-height: 2;">${stepsHtml}</div>
    </div>
  `;
};

/**
 * Builds Concise, DLT-Friendly SMS Messages for Customer Notifications
 */
const buildSmsContent = ({ event, order, returnRequest, transactionId, extraData = {} }) => {
  const orderId = order?._id ? order._id.toString() : "";
  const orderNum = orderId ? orderId.slice(-8).toUpperCase() : "N/A";
  const amount = Number(order?.totalAmount || returnRequest?.refundAmount || 0).toFixed(2);
  const baseUrl = process.env.CLIENT_URL || "https://venuscare.in";
  const trackUrl = `${baseUrl}/order/${orderId}`;

  switch (event) {
    case NOTIFICATION_EVENTS.ORDER_PLACED:
    case NOTIFICATION_EVENTS.ORDER_CONFIRMED:
      return `VENUS CARE: Thank you for your order #${orderNum} of Rs.${amount}. We are preparing your botanical skincare package. Track: ${trackUrl}`;

    case NOTIFICATION_EVENTS.PAYMENT_SUCCESSFUL:
      return `VENUS CARE: Payment of Rs.${amount} received for order #${orderNum}. Ref: ${transactionId || order?.paymentId || "Verified"}. Track: ${trackUrl}`;

    case NOTIFICATION_EVENTS.ORDER_SHIPPED:
      const courier = extraData.courier || order?.courier || "Express Partner";
      const trk = extraData.trackingNumber || order?.trackingNumber || "";
      return `VENUS CARE: Your order #${orderNum} has been shipped via ${courier}${trk ? ` (Tracking: ${trk})` : ""}. Track: ${trackUrl}`;

    case NOTIFICATION_EVENTS.OUT_FOR_DELIVERY:
      return `VENUS CARE: Your package for order #${orderNum} is out for delivery today. Please keep your phone reachable.`;

    case NOTIFICATION_EVENTS.ORDER_DELIVERED:
      const reviewUrl = `${baseUrl}/profile`;
      return `VENUS CARE: Your order #${orderNum} has been delivered. We hope you love your glow! Share your review: ${reviewUrl}`;

    case NOTIFICATION_EVENTS.RETURN_APPROVED:
      const pickupTrk = returnRequest?.pickupTrackingId || "Scheduled";
      return `VENUS CARE: Return request for order #${orderNum} is approved. Reverse pickup scheduled with tracking #${pickupTrk}.`;

    case NOTIFICATION_EVENTS.REFUND_COMPLETED:
      const refMethod = returnRequest?.refundMethod || order?.paymentMethod || "Original Payment Source";
      const refId = transactionId || returnRequest?.refundId || order?.refundTransactionId || "";
      return `VENUS CARE: Refund of Rs.${amount} for order #${orderNum} has been completed via ${refMethod}${refId ? ` (Ref: ${refId})` : ""}.`;

    default:
      return `VENUS CARE: Update on your order #${orderNum}. Check status: ${trackUrl}`;
  }
};

/**
 * Centralized, Idempotent Transactional Notification Dispatcher (Email + SMS)
 * @param {Object} params
 * @param {string} params.event - One of NOTIFICATION_EVENTS
 * @param {Object} params.order - Mongoose Order Document or Object
 * @param {Object} [params.returnRequest] - Mongoose ReturnRequest Document (for return events)
 * @param {Object} [params.user] - User Object (if available)
 * @param {string} [params.transactionId] - Payment or Refund Transaction ID
 * @param {Object} [params.extraData] - Any supplementary metadata
 */
const sendTransactionalNotification = async ({
  event,
  order,
  returnRequest = null,
  user = null,
  transactionId = "",
  extraData = {},
}) => {
  const result = {
    email: { success: false },
    sms: { success: false, skipped: true },
  };

  try {
    if (!order && !user) {
      console.warn("[Notification Service] Neither order nor user provided. Skipping notification.");
      return { success: false, message: "Missing recipient context" };
    }

    const recipientEmail = order?.customerEmail || user?.email;
    const recipientName = order?.customerName || user?.name || "Valued Customer";
    const recipientPhone = order?.customerPhone || order?.shippingAddress?.phone || user?.phone;
    const orderId = order?._id ? order._id.toString() : "";
    const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const viewOrderUrl = orderId ? `${baseUrl}/order/${orderId}` : `${baseUrl}/profile`;
    const invoiceUrl = orderId ? `${baseUrl}/api/orders/${orderId}/invoice` : "";

    const emailLockKey = `${orderId}_${event}_EMAIL`;
    const smsLockKey = `${orderId}_${event}_SMS`;

    // =========================================================================
    // CHANNEL 1: TRANSACTIONAL EMAIL DISPATCH
    // =========================================================================
    if (recipientEmail) {
      if (orderId && inFlightDispatches.has(emailLockKey)) {
        console.log(`[Notification Service - Email] In-flight concurrency lock active for event '${event}'. Skipping duplicate.`);
        result.email = { success: true, isDuplicate: true };
      } else {
        if (orderId) inFlightDispatches.add(emailLockKey);
        try {
          // Idempotency check in DB for Email
          let existingEmailLog = null;
          if (orderId) {
            existingEmailLog = await NotificationLog.findOne({
              orderId,
              eventType: event,
              channel: "EMAIL",
              status: "SENT",
            });
          }

          if (existingEmailLog) {
            console.log(`[Notification Service - Email] Event '${event}' already sent for order #${orderId.slice(-8)}. Idempotent skip.`);
            result.email = { success: true, isDuplicate: true, messageId: existingEmailLog.providerMessageId };
          } else {
            // Build Email Template
            let subject = "VENUS CARE Order Notification";
            let title = "Order Update";
            let bodyContent = "Your order status has been updated.";
            let actionButtonsHtml = `<a href="${viewOrderUrl}" class="btn btn-gold">View Order Details</a>`;
            let timelineHtml = "";
            let orderSummaryHtml = buildOrderSummaryHtml(order);

            switch (event) {
              case NOTIFICATION_EVENTS.ORDER_PLACED:
              case NOTIFICATION_EVENTS.ORDER_CONFIRMED:
                subject = `Order Confirmed! #${orderId.slice(-8).toUpperCase()} ✨`;
                title = "Your Order is Confirmed!";
                bodyContent = `
                  Thank you for choosing VENUS CARE. We have received your order and our fulfillment team has locked your items for preparation.<br /><br />
                  We will notify you the moment your package is packed and dispatched.
                `;
                actionButtonsHtml = `
                  <a href="${viewOrderUrl}" class="btn btn-gold">Track Order</a>
                  <a href="${baseUrl}/shop" class="btn btn-secondary">Explore More</a>
                `;
                timelineHtml = buildTimelineHtml("Pending");
                break;

              case NOTIFICATION_EVENTS.PAYMENT_SUCCESSFUL:
                subject = `Payment Received Successfully — Order #${orderId.slice(-8).toUpperCase()}`;
                title = "Payment Confirmation";
                bodyContent = `
                  We have successfully received your payment of <strong>₹${Number(order?.totalAmount || 0).toFixed(2)}</strong> via ${order?.paymentMethod || "Prepaid"}.<br />
                  Transaction Reference: <strong>${transactionId || order?.paymentId || "Verified"}</strong>.
                `;
                actionButtonsHtml = `
                  <a href="${viewOrderUrl}" class="btn btn-gold">View Order</a>
                  ${invoiceUrl ? `<a href="${invoiceUrl}" class="btn btn-secondary">Download Invoice</a>` : ""}
                `;
                break;

              case NOTIFICATION_EVENTS.ORDER_PACKED:
                subject = `Your Order is Packed & Ready for Dispatch 📦`;
                title = "Quality Check Passed & Packed";
                bodyContent = `
                  Great news! Your luxury botanical skincare products have passed final lab quality checks and are safely cushioned in luxury carrier wraps. Dispatches are scheduled shortly.
                `;
                actionButtonsHtml = `<a href="${viewOrderUrl}" class="btn btn-gold">View Packaging Status</a>`;
                timelineHtml = buildTimelineHtml("Packed");
                break;

              case NOTIFICATION_EVENTS.ORDER_SHIPPED:
                subject = `Your Order has been Shipped 🚚`;
                title = "Your Package is On the Way";
                const courierPartner = extraData.courier || order?.courier || "Express Logistics Partner";
                const trackingCode = extraData.trackingNumber || order?.trackingNumber || "";
                bodyContent = `
                  Your package has been dispatched from our central facility via <strong>${courierPartner}</strong>.<br />
                  ${trackingCode ? `Tracking Number: <strong>${trackingCode}</strong><br />` : ""}
                  Our logistics partner will reach out directly on your contact number before delivery.
                `;
                actionButtonsHtml = `<a href="${viewOrderUrl}" class="btn btn-gold">Track Shipment</a>`;
                timelineHtml = buildTimelineHtml("Shipped");
                break;

              case NOTIFICATION_EVENTS.OUT_FOR_DELIVERY:
                subject = `Your Package is Out for Delivery Today! ⚡`;
                title = "Arriving Today";
                bodyContent = `
                  Get ready to glow! Your delivery executive has loaded your VENUS CARE package onto today's regional route and will deliver to your doorstep shortly. Please keep your contact phone reachable.
                `;
                actionButtonsHtml = `<a href="${viewOrderUrl}" class="btn btn-gold">Track Live Delivery</a>`;
                timelineHtml = buildTimelineHtml("Out For Delivery");
                break;

              case NOTIFICATION_EVENTS.ORDER_DELIVERED:
                subject = `Your VENUS CARE Package Has Arrived ✨`;
                title = "Delivered Successfully";
                bodyContent = `
                  Hooray! Your order has been delivered safely. We hope our authentic formulas elevate your daily skincare ritual.<br /><br />
                  We would love to hear your thoughts! Share your experience and upload a photo to earn bonus Venus Coins.
                `;
                const reviewUrl = order?.items && order.items[0]
                  ? `${baseUrl}/product/${order.items[0].productId}?reviewModal=true&orderId=${orderId}`
                  : `${baseUrl}/profile`;
                actionButtonsHtml = `
                  <a href="${reviewUrl}" class="btn btn-gold">Write a Review</a>
                  ${invoiceUrl ? `<a href="${invoiceUrl}" class="btn btn-secondary">Download Invoice</a>` : ""}
                `;
                timelineHtml = buildTimelineHtml("Delivered");
                break;

              case NOTIFICATION_EVENTS.RETURN_REQUESTED:
                subject = `Return Request Received — Order #${orderId.slice(-8).toUpperCase()}`;
                title = "Return Application Received";
                const cat = returnRequest?.reasonCategory || "Product Issue";
                bodyContent = `
                  We have received your return application for order <strong>#${orderId.slice(-8).toUpperCase()}</strong> under category: <em>${cat}</em>.<br /><br />
                  Our quality administration team will review your explanation and proof photos within 24-48 business hours.
                `;
                actionButtonsHtml = `<a href="${baseUrl}/my-returns" class="btn btn-gold">View Return Status</a>`;
                break;

              case NOTIFICATION_EVENTS.RETURN_APPROVED:
                subject = `Return Approved & Reverse Pickup Scheduled 🚚`;
                title = "Return Approved";
                const pickupTracking = returnRequest?.pickupTrackingId || "Scheduled";
                const courierProvider = returnRequest?.pickupProvider || "Venus Express Logistics";
                bodyContent = `
                  Your return application for order <strong>#${orderId.slice(-8).toUpperCase()}</strong> has been approved.<br /><br />
                  A reverse pickup has been booked with <strong>${courierProvider}</strong> (Pickup Tracking ID: <strong>${pickupTracking}</strong>). Please keep the product securely packed with its original packaging for doorstep handover.
                `;
                actionButtonsHtml = `<a href="${baseUrl}/my-returns" class="btn btn-gold">Track Reverse Pickup</a>`;
                break;

              case NOTIFICATION_EVENTS.REFUND_COMPLETED:
                subject = `Refund Processed Successfully 💸`;
                title = "Refund Credited";
                const refAmt = returnRequest?.refundAmount || order?.totalAmount || 0;
                const refMethod = returnRequest?.refundMethod || order?.paymentMethod || "Original Payment Source";
                const refId = transactionId || returnRequest?.refundId || order?.refundTransactionId || "";
                bodyContent = `
                  We have completed the refund of <strong>₹${Number(refAmt).toFixed(2)}</strong> for order #${orderId.slice(-8).toUpperCase()} via ${refMethod}.<br />
                  ${refId ? `Transaction Reference: <strong>${refId}</strong><br />` : ""}
                  Depending on your bank/payment network, the credit will reflect in your account shortly.
                `;
                actionButtonsHtml = `<a href="${viewOrderUrl}" class="btn btn-gold">View Refund Details</a>`;
                break;

              default:
                subject = `Update on Order #${orderId.slice(-8).toUpperCase()}`;
                title = "Order Update";
                bodyContent = `Your order status is now: <strong>${event}</strong>.`;
                break;
            }

            const emailHtml = generateEmailHtml({
              title,
              greeting: `Hi ${recipientName},`,
              bodyContent,
              actionButtonsHtml,
              timelineHtml,
              orderSummaryHtml,
            });

            // Dispatch Email
            const sendResult = await sendEmail({
              email: recipientEmail,
              subject,
              message: emailHtml,
            });

            await NotificationLog.create({
              orderId: orderId || null,
              userId: order?.userId || user?._id || null,
              returnRequestId: returnRequest?._id || null,
              eventType: event,
              channel: "EMAIL",
              recipient: recipientEmail,
              subject,
              status: "SENT",
              provider: "Resend",
              providerMessageId: sendResult.messageId || "",
              sentAt: new Date(),
            });

            result.email = { success: true, messageId: sendResult.messageId };
          }
        } catch (emailErr) {
          console.error(`❌ [Notification Service] Email dispatch failed for event ${event}:`, emailErr.message);

          await NotificationLog.create({
            orderId: orderId || null,
            userId: order?.userId || user?._id || null,
            returnRequestId: returnRequest?._id || null,
            eventType: event,
            channel: "EMAIL",
            recipient: recipientEmail,
            subject: event,
            status: "FAILED",
            provider: "Resend",
            error: emailErr.message || "Failed to send email",
          }).catch((logErr) => console.error("Failed to log email failure:", logErr.message));

          result.email = { success: false, error: emailErr.message };
        } finally {
          if (orderId) inFlightDispatches.delete(emailLockKey);
        }
      }
    }

    // =========================================================================
    // CHANNEL 2: TRANSACTIONAL SMS DISPATCH
    // =========================================================================
    if (SMS_ENABLED_EVENTS.includes(event)) {
      if (orderId && inFlightDispatches.has(smsLockKey)) {
        console.log(`[Notification Service - SMS] In-flight concurrency lock active for event '${event}'. Skipping duplicate.`);
        result.sms = { success: true, isDuplicate: true };
      } else {
        if (orderId) inFlightDispatches.add(smsLockKey);
        try {
          // Idempotency check in DB for SMS
          let existingSmsLog = null;
          if (orderId) {
            existingSmsLog = await NotificationLog.findOne({
              orderId,
              eventType: event,
              channel: "SMS",
              status: "SENT",
            });
          }

          if (existingSmsLog) {
            console.log(`[Notification Service - SMS] Event '${event}' already sent for order #${orderId.slice(-8)}. Idempotent skip.`);
            result.sms = { success: true, isDuplicate: true, messageId: existingSmsLog.providerMessageId };
          } else {
            // Validate Phone Number
            const validation = smsService.validatePhone(recipientPhone);

            if (!validation.isValid) {
              // Log as SKIPPED so operations team has full visibility
              await NotificationLog.create({
                orderId: orderId || null,
                userId: order?.userId || user?._id || null,
                returnRequestId: returnRequest?._id || null,
                eventType: event,
                channel: "SMS",
                recipient: recipientPhone || "NO_PHONE_PROVIDED",
                status: "SKIPPED",
                error: validation.reason,
              }).catch(() => {});

              result.sms = { success: false, skipped: true, reason: validation.reason };
            } else {
              // Build SMS content
              const smsMessage = buildSmsContent({
                event,
                order,
                returnRequest,
                transactionId,
                extraData,
              });

              // Dispatch SMS via smsService
              const smsResult = await smsService.sendSMS({
                to: validation.formattedPhone,
                message: smsMessage,
                orderId,
                event,
              });

              if (smsResult.success) {
                await NotificationLog.create({
                  orderId: orderId || null,
                  userId: order?.userId || user?._id || null,
                  returnRequestId: returnRequest?._id || null,
                  eventType: event,
                  channel: "SMS",
                  recipient: validation.formattedPhone,
                  messageBody: smsMessage,
                  status: "SENT",
                  provider: smsResult.provider || "MockSmsProvider",
                  providerMessageId: smsResult.messageId || "",
                  sentAt: new Date(),
                });

                result.sms = { success: true, messageId: smsResult.messageId };
              } else {
                await NotificationLog.create({
                  orderId: orderId || null,
                  userId: order?.userId || user?._id || null,
                  returnRequestId: returnRequest?._id || null,
                  eventType: event,
                  channel: "SMS",
                  recipient: validation.formattedPhone,
                  messageBody: smsMessage,
                  status: "FAILED",
                  provider: smsResult.provider || "SmsService",
                  error: smsResult.error || "SMS dispatch failed",
                });

                result.sms = { success: false, error: smsResult.error };
              }
            }
          }
        } catch (smsErr) {
          console.error(`❌ [Notification Service] SMS dispatch failed for event ${event}:`, smsErr.message);
          result.sms = { success: false, error: smsErr.message };
        } finally {
          if (orderId) inFlightDispatches.delete(smsLockKey);
        }
      }
    }

    return {
      success: result.email.success || result.sms.success,
      channels: result,
    };
  } catch (err) {
    console.error("🔴 [Notification Service Exception]:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * 1. Account Welcome Email
 */
const sendWelcomeEmail = async (user) => {
  const title = "Welcome to VENUS CARE ✨";
  const greeting = `Hi ${user.name || "Beautiful"},`;
  const bodyContent = `
    Welcome to VENUS CARE - where science meets luxury botanical skincare.<br /><br />
    We are thrilled to welcome you to our community. Your account has been configured. Discover our curated catalog of authentic, premium formulas engineered specifically for your glow.
  `;
  const actionButtonsHtml = `
    <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/shop" class="btn btn-gold">Explore Store</a>
    <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/profile" class="btn btn-secondary">My Account</a>
  `;

  const html = generateEmailHtml({ title, greeting, bodyContent, actionButtonsHtml });
  await sendEmail({ email: user.email, subject: "Welcome to VENUS CARE ✨", message: html });
};

/**
 * 2. Email Verification OTP
 */
const sendEmailVerificationOtp = async (user, otp) => {
  const title = "Verify Your Email Address";
  const greeting = `Hi ${user.name || "Customer"},`;
  const bodyContent = `
    To continue with your transaction, please verify your email address.<br /><br />
    Use the following secure One-Time Password (OTP):
    <div style="background: #FAF9F6; border: 1px solid #ECE7DF; padding: 18px; font-size: 28px; font-weight: bold; color: #C8A165; letter-spacing: 6px; text-align: center; border-radius: 8px; margin: 20px 0; font-family: monospace;">
      ${otp}
    </div>
    This code is valid for exactly <strong>10 minutes</strong>. If you did not initiate this request, please ignore this email.
  `;
  const html = generateEmailHtml({ title, greeting, bodyContent });
  await sendEmail({ email: user.email, subject: "Verification OTP - VENUS CARE", message: html });
};

/**
 * 3. Forgot Password OTP
 */
const sendForgotPasswordOtp = async (user, otp) => {
  const title = "Reset Your Password OTP";
  const greeting = `Hi ${user.name || "Customer"},`;
  const bodyContent = `
    We received a request to reset your password. Use the following OTP to continue:
    <div style="background: #FAF9F6; border: 1px solid #ECE7DF; padding: 18px; font-size: 24px; font-weight: bold; color: #C8A165; letter-spacing: 4px; text-align: center; border-radius: 8px; margin: 20px 0;">
      ${otp}
    </div>
    This OTP will expire in <strong>5 minutes</strong>. If you did not request a password reset, please ignore this email.
  `;
  const html = generateEmailHtml({ title, greeting, bodyContent });
  await sendEmail({ email: user.email, subject: "Reset Password OTP - VENUS CARE", message: html });
};

/**
 * Backward compatibility wrappers
 */
const sendPaymentSuccessEmail = async (order, transactionId) => {
  return await sendTransactionalNotification({
    event: NOTIFICATION_EVENTS.PAYMENT_SUCCESSFUL,
    order,
    transactionId,
  });
};

const sendTimelineStatusEmailAsync = async (order, status) => {
  let mappedEvent = NOTIFICATION_EVENTS.ORDER_CONFIRMED;
  if (status === "Packed") mappedEvent = NOTIFICATION_EVENTS.ORDER_PACKED;
  else if (status === "Shipped") mappedEvent = NOTIFICATION_EVENTS.ORDER_SHIPPED;
  else if (status === "Out For Delivery") mappedEvent = NOTIFICATION_EVENTS.OUT_FOR_DELIVERY;
  else if (status === "Delivered") mappedEvent = NOTIFICATION_EVENTS.ORDER_DELIVERED;
  else if (status === "Return Requested") mappedEvent = NOTIFICATION_EVENTS.RETURN_REQUESTED;
  else if (status === "Return Approved" || status === "Pickup Scheduled") mappedEvent = NOTIFICATION_EVENTS.RETURN_APPROVED;
  else if (status === "Refund Completed") mappedEvent = NOTIFICATION_EVENTS.REFUND_COMPLETED;
  else if (status === "Pending") mappedEvent = NOTIFICATION_EVENTS.ORDER_PLACED;

  return await sendTransactionalNotification({
    event: mappedEvent,
    order,
  });
};

const sendOrderStatusNotification = async (order, newStatus, oldStatus) => {
  if (newStatus === oldStatus) return;
  return await sendTimelineStatusEmailAsync(order, newStatus);
};

const sendWhatsAppNotification = async () => {};

module.exports = {
  NOTIFICATION_EVENTS,
  SMS_ENABLED_EVENTS,
  sendTransactionalNotification,
  sendWelcomeEmail,
  sendEmailVerificationOtp,
  sendForgotPasswordOtp,
  sendPaymentSuccessEmail,
  sendTimelineStatusEmailAsync,
  sendOrderStatusNotification,
  sendWhatsAppNotification,
};
