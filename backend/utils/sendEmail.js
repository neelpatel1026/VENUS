const nodemailer = require("nodemailer");
const dns = require("dns");

// Force Node to prioritize IPv4 DNS resolution to prevent ENETUNREACH errors on IPv6-unfriendly environments (like Render)
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
  console.log("[SMTP DNS] Prioritizing IPv4 resolution for outbound connections.");
}

const sendEmail = async ({
  email,
  subject,
  message,
}) => {
  try {
    const user = process.env.EMAIL_USER || process.env.GMAIL_USER;
    const pass = process.env.EMAIL_PASS || process.env.GMAIL_PASS;
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
    const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587");
    const secure = process.env.EMAIL_SECURE === "true" || process.env.SMTP_SECURE === "true" || port === 465;

    let transporterOptions;
    if (host) {
      transporterOptions = {
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      };
    } else {
      transporterOptions = {
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Use STARTTLS (port 587)
        auth: {
          user,
          pass,
        },
      };
    }

    // Dynamic strict timeouts to prevent hangs
    transporterOptions.connectionTimeout = 10000;
    transporterOptions.greetingTimeout = 10000;
    transporterOptions.socketTimeout = 15000;
    transporterOptions.family = 4; // Force IPv4 to bypass cloud provider IPv6 routing limits


    const transporter = nodemailer.createTransport(transporterOptions);

    const mailOptions = {
      from: `"VENUS CARE Support" <${user}>`,
      to: email,
      subject,
      html: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email successfully sent to ${email}`);

    return {
      success: true,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error(`❌ Email sending failed to ${email}: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;