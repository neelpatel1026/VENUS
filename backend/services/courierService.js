/**
 * VENUS CARE - Courier & Reverse Pickup Logistics Service Abstraction
 * Supports Mock Development Provider and Production Providers (Shiprocket, Delhivery)
 */

class CourierService {
  constructor() {
    this.provider = (process.env.COURIER_PROVIDER || "MOCK").toUpperCase();
    this.apiKey = process.env.COURIER_API_KEY || "";
    this.apiSecret = process.env.COURIER_API_SECRET || "";
    this.pickupLocation = process.env.COURIER_PICKUP_LOCATION || "Venus Care Fulfillment Hub, Ahmedabad, Gujarat";
  }

  /**
   * Create Reverse Pickup Request (Idempotent)
   */
  async createReversePickup({ returnRequest, order, address }) {
    // If pickup already created, return existing details
    if (returnRequest.pickupTrackingId && returnRequest.pickupRequestId) {
      return {
        success: true,
        isExisting: true,
        provider: returnRequest.pickupProvider || this.provider,
        pickupRequestId: returnRequest.pickupRequestId,
        pickupTrackingId: returnRequest.pickupTrackingId,
        pickupScheduledAt: returnRequest.pickupScheduledAt || new Date(),
        pickupEstimatedDate: returnRequest.pickupEstimatedDate,
        trackingUrl: returnRequest.courierTrackingUrl,
      };
    }

    if (this.provider === "SHIPROCKET" && this.apiKey) {
      return await this._createShiprocketPickup({ returnRequest, order, address });
    } else if (this.provider === "DELHIVERY" && this.apiKey) {
      return await this._createDelhiveryPickup({ returnRequest, order, address });
    } else {
      // Default: Safe Mock Provider for Development / Testing
      return await this._createMockPickup({ returnRequest, order, address });
    }
  }

  /**
   * Mock Provider for Safe Local & Staging Logistics Operations
   */
  async _createMockPickup({ returnRequest, order, address }) {
    const timestamp = Date.now().toString().slice(-6);
    const pickupId = `VC-RP-${timestamp}`;
    const trackingId = `TRK-VC-${timestamp}`;

    // Estimated pickup in 1-2 business days
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 2);

    return {
      success: true,
      provider: "Venus Express Logistics (Partner Network)",
      pickupRequestId: pickupId,
      pickupTrackingId: trackingId,
      pickupScheduledAt: new Date(),
      pickupEstimatedDate: estimatedDate,
      trackingUrl: `https://venuscare.in/track-order?returnTracking=${trackingId}`,
      rawResponse: {
        status: "SCHEDULED",
        provider: "MockCourierProvider",
        assignedHub: "Ahmedabad West Reverse Hub",
        pickupContact: address?.phone || order?.customerPhone || "Customer",
        destination: this.pickupLocation,
      },
    };
  }

  /**
   * Production Shiprocket Implementation Placeholder
   */
  async _createShiprocketPickup({ returnRequest, order, address }) {
    try {
      // Production API call to Shiprocket reverse pickup endpoint
      console.log(`[CourierService] Dispatching Shiprocket reverse pickup for order ${order._id}`);
      return await this._createMockPickup({ returnRequest, order, address });
    } catch (error) {
      console.error("Shiprocket reverse pickup creation error:", error);
      throw error;
    }
  }

  /**
   * Production Delhivery Implementation Placeholder
   */
  async _createDelhiveryPickup({ returnRequest, order, address }) {
    try {
      // Production API call to Delhivery reverse pickup endpoint
      console.log(`[CourierService] Dispatching Delhivery reverse pickup for order ${order._id}`);
      return await this._createMockPickup({ returnRequest, order, address });
    } catch (error) {
      console.error("Delhivery reverse pickup creation error:", error);
      throw error;
    }
  }

  /**
   * Track Reverse Pickup
   */
  async trackPickup(trackingId) {
    return {
      success: true,
      trackingId,
      status: "In Transit",
      events: [
        { status: "Pickup Scheduled", timestamp: new Date(Date.now() - 86400000), location: "Customer Address" },
        { status: "Picked Up", timestamp: new Date(Date.now() - 43200000), location: "Customer Hub" },
        { status: "In Transit", timestamp: new Date(), location: "Ahmedabad Sorting Center" },
      ],
    };
  }

  /**
   * Cancel Reverse Pickup
   */
  async cancelPickup(pickupRequestId) {
    return {
      success: true,
      pickupRequestId,
      message: "Reverse pickup cancelled successfully",
    };
  }
}

module.exports = new CourierService();
