const Order = require("../models/Order");
const Review = require("../models/Review");
const { sendReviewReminderEmail } = require("./notificationService");
const cron = require("node-cron");

const checkAndSendReviewReminders = async () => {
  try {
    console.log("⏱️ [Review Automation] Checking delivered orders for review campaign dispatch...");

    // Smart Filter: Delivered orders where campaign is active and not refunded/cancelled
    const orders = await Order.find({
      status: "Delivered",
      paymentStatus: { $ne: "Refunded" },
      reviewCampaignCompleted: { $ne: true },
      deliveredAt: { $exists: true, $ne: null },
    });

    console.log(`🔍 [Review Automation] Evaluating ${orders.length} delivered orders.`);

    const now = Date.now();

    for (const order of orders) {
      // Find unreviewed items
      const unreviewedItems = [];
      for (const item of order.items) {
        const alreadyReviewed = await Review.findOne({
          productId: item.productId,
          userId: order.userId,
        });
        if (!alreadyReviewed) {
          unreviewedItems.push(item);
        }
      }

      // If all items have been reviewed, mark campaign completed and stop
      if (unreviewedItems.length === 0) {
        order.reviewCampaignCompleted = true;
        order.reviewReminderSent = true;
        await order.save();
        continue;
      }

      const deliveredAtTime = new Date(order.deliveredAt).getTime();
      const daysSinceDelivery = (now - deliveredAtTime) / (1000 * 60 * 60 * 24);
      const lastSentTime = order.lastReviewReminderSentAt
        ? new Date(order.lastReviewReminderSentAt).getTime()
        : 0;
      const daysSinceLastSent = (now - lastSentTime) / (1000 * 60 * 60 * 24);

      const currentCount = order.reviewReminderCount || 0;
      let shouldSend = false;
      let nextStage = currentCount + 1;

      if (currentCount === 0 && daysSinceDelivery >= 5) {
        // Stage 1: 5 Days after delivery
        shouldSend = true;
      } else if (currentCount === 1 && daysSinceLastSent >= 5) {
        // Stage 2: 5 Days after Email 1
        shouldSend = true;
      } else if (currentCount === 2 && daysSinceLastSent >= 10) {
        // Stage 3: 10 Days after Email 2
        shouldSend = true;
      }

      if (shouldSend) {
        try {
          await sendReviewReminderEmail(order, unreviewedItems, nextStage);

          order.reviewReminderCount = nextStage;
          order.lastReviewReminderSentAt = new Date();
          order.reviewReminderSent = true;

          if (nextStage >= 3) {
            order.reviewCampaignCompleted = true;
          }

          await order.save();
          console.log(`✅ [Review Automation] Dispatched Stage ${nextStage} review reminder to: ${order.customerEmail}`);
        } catch (err) {
          console.error(`❌ [Review Automation] Failed to dispatch reminder to ${order.customerEmail}:`, err.message);
        }
      }
    }
  } catch (error) {
    console.error("❌ [Review Automation Error]:", error.message);
  }
};

// Scheduler setup using node-cron
const startReviewScheduler = () => {
  // Initial run after 20 seconds on server start
  setTimeout(checkAndSendReviewReminders, 20000);

  // Cron schedule: Run every 12 hours ('0 */12 * * *')
  cron.schedule("0 */12 * * *", () => {
    checkAndSendReviewReminders();
  });
};

module.exports = {
  checkAndSendReviewReminders,
  startReviewScheduler,
};
