/**
 * VENUS CARE - Transactional SMS Service Abstraction Layer
 * Supports: MOCK (Default for Dev/Staging), FAST2SMS, TWILIO, MSG91
 */

class SmsService {
  constructor() {
    this.provider = (process.env.SMS_PROVIDER || "MOCK").toUpperCase();
    this.apiKey = process.env.SMS_API_KEY || "";
    this.senderId = process.env.SMS_SENDER_ID || "VNSCAR";
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "";
  }

  /**
   * Phone Number Format & Validity Checker
   * Validates standard 10-digit Indian mobile numbers (starting with 6, 7, 8, 9)
   * with optional +91, 91, or 0 prefixes.
   */
  validatePhone(rawPhone) {
    if (!rawPhone || typeof rawPhone !== "string") {
      return {
        isValid: false,
        reason: "Missing or invalid phone number input",
        formattedPhone: null,
      };
    }

    // Strip whitespace, hyphens, parentheses, and dots
    const cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, "");

    if (cleaned.length === 0) {
      return {
        isValid: false,
        reason: "Empty phone number",
        formattedPhone: null,
      };
    }

    // Match 10-digit Indian mobile starting with 6, 7, 8, 9
    // Accept: +919876543210, 919876543210, 09876543210, 9876543210
    const indianMobileRegex = /^(?:\+91|91|0)?([6-9]\d{9})$/;
    const match = cleaned.match(indianMobileRegex);

    if (!match) {
      return {
        isValid: false,
        reason: `Invalid mobile format '${rawPhone}'. Must be a valid 10-digit Indian mobile number.`,
        formattedPhone: null,
      };
    }

    const tenDigitNumber = match[1];
    const formattedPhone = `+91${tenDigitNumber}`;

    return {
      isValid: true,
      formattedPhone,
      tenDigitNumber,
    };
  }

  /**
   * Central SMS Dispatcher
   */
  async sendSMS({ to, message, orderId = "", event = "" }) {
    try {
      const validation = this.validatePhone(to);

      if (!validation.isValid) {
        return {
          success: false,
          skipped: true,
          reason: validation.reason,
          provider: this.provider,
        };
      }

      const recipientNumber = validation.formattedPhone;

      if (this.provider === "FAST2SMS" && this.apiKey) {
        return await this._sendViaFast2SMS({
          recipient: validation.tenDigitNumber,
          message,
        });
      } else if (this.provider === "TWILIO" && this.twilioAccountSid && this.twilioAuthToken) {
        return await this._sendViaTwilio({
          recipient: recipientNumber,
          message,
        });
      } else if (this.provider === "MSG91" && this.apiKey) {
        return await this._sendViaMsg91({
          recipient: validation.tenDigitNumber,
          message,
        });
      } else {
        // Default: Mock Provider for Safe Local/Staging Environment
        return await this._sendViaMock({
          recipient: recipientNumber,
          message,
          orderId,
          event,
        });
      }
    } catch (error) {
      console.error(`❌ [SMS Service] Dispatch error to ${to}:`, error.message);
      return {
        success: false,
        error: error.message || "Failed to send SMS",
        provider: this.provider,
      };
    }
  }

  /**
   * Mock Provider for Safe Development & Testing
   */
  async _sendViaMock({ recipient, message, orderId, event }) {
    const messageId = `sms_mock_${Date.now().toString().slice(-8)}`;
    console.log(`📱 [SMS Service - MockProvider] Sent to ${recipient} [Event: ${event || "General"}]: "${message}"`);

    return {
      success: true,
      provider: "MockSmsProvider",
      messageId,
      recipient,
      sentAt: new Date(),
    };
  }

  /**
   * Fast2SMS Integration (India Transactional Quick SMS Route)
   */
  async _sendViaFast2SMS({ recipient, message }) {
    try {
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: message,
          language: "english",
          flash: 0,
          numbers: recipient,
        }),
      });

      const data = await response.json();

      if (data.return) {
        return {
          success: true,
          provider: "Fast2SMS",
          messageId: data.request_id || `f2s_${Date.now()}`,
          recipient,
        };
      } else {
        throw new Error(data.message?.[0] || "Fast2SMS dispatch failed");
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * Twilio REST API Integration
   */
  async _sendViaTwilio({ recipient, message }) {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;
      const auth = Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString("base64");

      const params = new URLSearchParams();
      params.append("To", recipient);
      params.append("From", this.twilioPhoneNumber);
      params.append("Body", message);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (response.ok && data.sid) {
        return {
          success: true,
          provider: "Twilio",
          messageId: data.sid,
          recipient,
        };
      } else {
        throw new Error(data.message || "Twilio SMS dispatch failed");
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * MSG91 API Integration
   */
  async _sendViaMsg91({ recipient, message }) {
    try {
      const response = await fetch("https://api.msg91.com/api/v2/sendsms", {
        method: "POST",
        headers: {
          authkey: this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: this.senderId,
          route: "4",
          country: "91",
          sms: [
            {
              message: message,
              to: [recipient],
            },
          ],
        }),
      });

      const data = await response.json();
      if (data.type === "success") {
        return {
          success: true,
          provider: "MSG91",
          messageId: data.message || `msg91_${Date.now()}`,
          recipient,
        };
      } else {
        throw new Error(data.message || "MSG91 dispatch failed");
      }
    } catch (err) {
      throw err;
    }
  }
}

module.exports = new SmsService();
