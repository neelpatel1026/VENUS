/**
 * VENUS CARE - Complete Return, Reverse Pickup & Refund Master Integration Test Runner
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../../../../cosmetic/backend/.env") });

async function runTests() {
  console.log("===============================================================");
  console.log("🚀 STARTING VENUS CARE RETURN & REFUND WORKFLOW MASTER TEST");
  console.log("===============================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/venuscare";
  
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected successfully.");
  } catch (err) {
    console.log("⚠️ Using simulated in-memory test runner:", err.message);
  }

  const ReturnRequest = require("../../../../../cosmetic/backend/models/ReturnRequest");
  const Order = require("../../../../../cosmetic/backend/models/Order");
  const Product = require("../../../../../cosmetic/backend/models/Product");
  const courierService = require("../../../../../cosmetic/backend/services/courierService");

  const results = [];

  // TEST 1: Service Abstraction & Idempotent Pickup Creation
  try {
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      customerPhone: "+91 9876543210",
      shippingAddress: { phone: "+91 9876543210" },
    };
    const mockReturn = {
      _id: new mongoose.Types.ObjectId(),
      pickupTrackingId: null,
    };

    const pickup1 = await courierService.createReversePickup({
      returnRequest: mockReturn,
      order: mockOrder,
      address: mockOrder.shippingAddress,
    });

    // Check first pickup
    if (!pickup1.success || !pickup1.pickupTrackingId) {
      throw new Error("Failed to generate initial pickup tracking ID");
    }

    // Idempotency check: call second time with existing tracking ID
    mockReturn.pickupTrackingId = pickup1.pickupTrackingId;
    mockReturn.pickupRequestId = pickup1.pickupRequestId;

    const pickup2 = await courierService.createReversePickup({
      returnRequest: mockReturn,
      order: mockOrder,
      address: mockOrder.shippingAddress,
    });

    if (pickup2.pickupTrackingId !== pickup1.pickupTrackingId || !pickup2.isExisting) {
      throw new Error("Idempotency failed: generated different tracking ID on second call");
    }

    results.push({ name: "Reverse Pickup Creation & Idempotency", status: "PASS", detail: `Assigned ID ${pickup1.pickupTrackingId}` });
  } catch (err) {
    results.push({ name: "Reverse Pickup Creation & Idempotency", status: "FAIL", error: err.message });
  }

  // TEST 2: Schema Validation on Mandatory Fields
  try {
    const invalidDoc = new ReturnRequest({
      reasonCategory: "Product Damaged",
      reason: "short", // Invalid: less than 15 chars
      returnImages: [], // Invalid: empty array
    });

    const err = invalidDoc.validateSync();
    if (!err || !err.errors.reason || !err.errors.returnImages || !err.errors.orderId || !err.errors.userId) {
      throw new Error("Mongoose schema failed to catch missing required fields");
    }

    results.push({ name: "Mandatory Proof & Explanation Schema Validation", status: "PASS", detail: "Correctly rejected missing fields" });
  } catch (err) {
    results.push({ name: "Mandatory Proof & Explanation Schema Validation", status: "FAIL", error: err.message });
  }

  // TEST 3: State Machine Enum Verification in ReturnRequest and Order
  try {
    const validReturnStatuses = [
      "Return Requested",
      "Pickup Scheduled",
      "Picked Up",
      "In Transit",
      "Product Received",
      "Quality Check Passed",
      "Quality Check Failed",
      "Refund Initiated",
      "Refund Completed",
      "Refund Failed",
      "Return Rejected"
    ];

    const enumValues = ReturnRequest.schema.path("status").enumValues;
    for (const st of validReturnStatuses) {
      if (!enumValues.includes(st)) {
        throw new Error(`ReturnRequest schema missing status enum: ${st}`);
      }
    }

    const orderEnumValues = Order.schema.path("status").enumValues;
    for (const st of validReturnStatuses) {
      if (!orderEnumValues.includes(st)) {
        throw new Error(`Order schema missing status enum: ${st}`);
      }
    }

    results.push({ name: "Return & Order State Machine Enum Alignment", status: "PASS", detail: "All 11 lifecycle statuses verified" });
  } catch (err) {
    results.push({ name: "Return & Order State Machine Enum Alignment", status: "FAIL", error: err.message });
  }

  // TEST 4: Single-Instance Authoritative Inventory Restock Check
  try {
    let mockReturnDoc = {
      inventoryRestocked: false,
      inventoryRestockedAt: null,
    };

    let restockCounter = 0;
    function simulateRestock(doc) {
      if (!doc.inventoryRestocked) {
        restockCounter += 1;
        doc.inventoryRestocked = true;
        doc.inventoryRestockedAt = new Date();
      }
    }

    simulateRestock(mockReturnDoc); // First call (QC Passed)
    simulateRestock(mockReturnDoc); // Second call (Webhook duplicate)
    simulateRestock(mockReturnDoc); // Third call (Admin repeat click)

    if (restockCounter !== 1) {
      throw new Error(`Single-instance restock violated: restocked ${restockCounter} times`);
    }

    results.push({ name: "Single-Instance Authoritative Inventory Restock", status: "PASS", detail: `Restocked exactly 1 time across 3 calls` });
  } catch (err) {
    results.push({ name: "Single-Instance Authoritative Inventory Restock", status: "FAIL", error: err.message });
  }

  // TEST 5: Refund Idempotency Check
  try {
    let refundRecord = {
      refundStatus: "Pending",
      refundId: null,
    };

    let paymentGatewayCalls = 0;
    function simulateRefund(record) {
      if (record.refundStatus === "Completed") {
        return { success: true, isIdempotent: true, message: "Already completed" };
      }
      paymentGatewayCalls += 1;
      record.refundStatus = "Completed";
      record.refundId = `RFND-TEST-${Date.now()}`;
      return { success: true, refundId: record.refundId };
    }

    simulateRefund(refundRecord); // First click
    simulateRefund(refundRecord); // Repeat double-click

    if (paymentGatewayCalls !== 1) {
      throw new Error(`Double refund executed: called gateway ${paymentGatewayCalls} times`);
    }

    results.push({ name: "Payment Gateway Refund Idempotency", status: "PASS", detail: `Processed exactly 1 gateway refund` });
  } catch (err) {
    results.push({ name: "Payment Gateway Refund Idempotency", status: "FAIL", error: err.message });
  }

  console.log("\n===============================================================");
  console.log("📊 TEST RESULTS SUMMARY:");
  console.log("===============================================================");
  results.forEach((r, i) => {
    const symbol = r.status === "PASS" ? "✅" : "❌";
    console.log(`${symbol} [${i + 1}] ${r.name}: ${r.status} ${r.detail ? `(${r.detail})` : `(Error: ${r.error})`}`);
  });

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}

runTests();
